import { createClient } from '@/lib/supabase/client'

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const BUCKET_LIMITS: Record<'shop-logos' | 'shop-covers' | 'product-images', number> = {
  'shop-logos': 5 * 1024 * 1024,
  'shop-covers': 10 * 1024 * 1024,
  'product-images': 5 * 1024 * 1024,
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

export async function uploadShopImage(
  bucket: 'shop-logos' | 'shop-covers' | 'product-images',
  shopId: string,
  file: File
) {
  assertValidImage(bucket, file)

  const supabase = createClient()
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
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
