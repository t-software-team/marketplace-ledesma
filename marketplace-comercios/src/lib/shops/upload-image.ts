import { createClient } from '@/lib/supabase/client'

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const BUCKET_LIMITS: Record<'shop-logos' | 'shop-covers' | 'product-images' | 'shop-promotions', number> = {
  'shop-logos': 5 * 1024 * 1024,
  'shop-covers': 10 * 1024 * 1024,
  'product-images': 5 * 1024 * 1024,
  'shop-promotions': 5 * 1024 * 1024,
}

function assertValidImage(bucket: keyof typeof BUCKET_LIMITS, file: File) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('El archivo debe ser una imagen (PNG, JPEG, WEBP o GIF)')
  }

  const maxSize = BUCKET_LIMITS[bucket]
  if (file.size > maxSize) {
    throw new Error(`La imagen no puede pesar más de ${Math.round(maxSize / (1024 * 1024))}MB`)
  }
}

const COMPRESS_MAX_DIMENSION = 1600
const COMPRESS_JPEG_QUALITY = 0.82
const COMPRESS_SKIP_BELOW_BYTES = 800 * 1024

/**
 * Downscales and re-encodes an image client-side before upload. Phone
 * photos routinely come in at 4-5MB / 4000px+, which is wasted bandwidth
 * and storage for anything shown at a few hundred px. GIFs are left alone
 * to keep animation; if compression doesn't actually shrink the file
 * (already-optimized images), the original is kept.
 */
async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (error) {
    console.error('compressImage: no pudimos leer la imagen, se sube sin comprimir', { error })
    return file
  }

  const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= COMPRESS_SKIP_BELOW_BYTES) {
    bitmap.close()
    return file
  }

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? COMPRESS_JPEG_QUALITY : undefined)
  )

  if (!blob || blob.size >= file.size) return file

  const newName = file.name.replace(/\.\w+$/, outputType === 'image/png' ? '.png' : '.jpg')
  return new File([blob], newName, { type: outputType })
}

export async function uploadShopImage(
  bucket: 'shop-logos' | 'shop-covers' | 'product-images' | 'shop-promotions',
  shopId: string,
  file: File
) {
  assertValidImage(bucket, file)
  const processedFile = await compressImage(file)

  const supabase = createClient()
  const extension = processedFile.name.split('.').pop() ?? 'jpg'
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(path, processedFile, {
    upsert: false,
  })

  if (error) {
    console.error('uploadShopImage: fallo al subir a Storage', { bucket, shopId, error })
    throw new Error('No pudimos subir la imagen')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return publicUrl
}

const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const VIDEO_MAX_SIZE = 20 * 1024 * 1024
const VIDEO_MAX_DURATION_SECONDS = 45

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('No pudimos leer el video'))
    }
    video.src = URL.createObjectURL(file)
  })
}

export async function uploadProductVideo(shopId: string, file: File) {
  if (!VIDEO_MIME_TYPES.includes(file.type)) {
    throw new Error('El video debe ser MP4, WEBM o MOV')
  }

  if (file.size > VIDEO_MAX_SIZE) {
    throw new Error(`El video no puede pesar más de ${VIDEO_MAX_SIZE / (1024 * 1024)}MB`)
  }

  const duration = await readVideoDuration(file)
  if (duration > VIDEO_MAX_DURATION_SECONDS) {
    throw new Error(`El video no puede durar más de ${VIDEO_MAX_DURATION_SECONDS} segundos`)
  }

  const supabase = createClient()
  const extension = file.name.split('.').pop() ?? 'mp4'
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('product-videos').upload(path, file, {
    upsert: false,
  })

  if (error) {
    console.error('uploadProductVideo: fallo al subir a Storage', { shopId, error })
    throw new Error('No pudimos subir el video')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('product-videos').getPublicUrl(path)

  return publicUrl
}

const PAYMENT_PROOF_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const PAYMENT_PROOF_MAX_SIZE = 10 * 1024 * 1024

export async function uploadPaymentProof(shopId: string, file: File) {
  if (!PAYMENT_PROOF_MIME_TYPES.includes(file.type)) {
    throw new Error('El comprobante debe ser una imagen o un PDF')
  }

  if (file.size > PAYMENT_PROOF_MAX_SIZE) {
    throw new Error('El comprobante no puede pesar más de 10MB')
  }

  const supabase = createClient()
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('payment-proofs').upload(path, file, {
    upsert: false,
  })

  if (error) {
    console.error('uploadPaymentProof: fallo al subir a Storage', { shopId, error })
    throw new Error('No pudimos subir el comprobante')
  }

  return path
}

const VERIFICATION_DOC_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const VERIFICATION_DOC_MAX_SIZE = 10 * 1024 * 1024

export async function uploadVerificationDocument(shopId: string, file: File) {
  if (!VERIFICATION_DOC_MIME_TYPES.includes(file.type)) {
    throw new Error('El documento debe ser una imagen o un PDF')
  }

  if (file.size > VERIFICATION_DOC_MAX_SIZE) {
    throw new Error('El documento no puede pesar más de 10MB')
  }

  const supabase = createClient()
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('verification-docs').upload(path, file, {
    upsert: false,
  })

  if (error) {
    console.error('uploadVerificationDocument: fallo al subir a Storage', { shopId, error })
    throw new Error('No pudimos subir el documento')
  }

  return path
}

const AVATAR_MAX_SIZE = 3 * 1024 * 1024

export async function uploadAvatar(userId: string, file: File) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('El archivo debe ser una imagen (PNG, JPEG, WEBP o GIF)')
  }

  if (file.size > AVATAR_MAX_SIZE) {
    throw new Error('La imagen no puede pesar más de 3MB')
  }

  const processedFile = await compressImage(file)

  const supabase = createClient()
  const extension = processedFile.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('avatars').upload(path, processedFile, {
    upsert: false,
  })

  if (error) {
    console.error('uploadAvatar: fallo al subir a Storage', { userId, error })
    throw new Error('No pudimos subir la imagen')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path)

  return publicUrl
}
