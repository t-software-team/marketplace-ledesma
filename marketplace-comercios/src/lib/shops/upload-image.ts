import { createClient } from '@/lib/supabase/client'

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const BUCKET_LIMITS: Record<
  'shop-logos' | 'shop-covers' | 'product-images' | 'shop-promotions' | 'patient-photos',
  number
> = {
  'shop-logos': 5 * 1024 * 1024,
  'shop-covers': 10 * 1024 * 1024,
  'product-images': 5 * 1024 * 1024,
  'shop-promotions': 5 * 1024 * 1024,
  // NOTA (runbook): a diferencia de los demás buckets de este objeto, este es
  // nuevo (módulo Pacientes) y todavía no está provisionado en Supabase — el
  // bucket + sus policies de Storage se crean a mano en el dashboard antes de
  // poder subir fotos en producción. Ver docs/PENDIENTES.md.
  'patient-photos': 5 * 1024 * 1024,
}

// NOTA (runbook, ver docs/PENDIENTES.md): igual que `patient-photos`, el
// bucket `patient-documents` (adjuntos del historial clínico, PR7a) todavía
// no está provisionado en Supabase — se crea a mano en el dashboard antes de
// poder subir adjuntos en producción.
const PATIENT_DOCUMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const PATIENT_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024

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
const THUMB_MAX_DIMENSION = 600
const THUMB_SUFFIX = '-thumb'

/**
 * Downscales and re-encodes an image client-side before upload. Phone
 * photos routinely come in at 4-5MB / 4000px+, which is wasted bandwidth
 * and storage for anything shown at a few hundred px. GIFs are left alone
 * to keep animation; if compression doesn't actually shrink the file
 * (already-optimized images), the original is kept.
 */
async function resizeImage(file: File, maxDimension: number, skipBelowBytes: number): Promise<File> {
  if (file.type === 'image/gif') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (error) {
    console.error('resizeImage: no pudimos leer la imagen, se sube sin comprimir', { error })
    return file
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= skipBelowBytes) {
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

  // WebP en vez de JPEG/PNG: mismo pipeline de resize, bien menos peso por
  // imagen. Relevante ahora que Vercel Image Optimization está desactivada
  // (unoptimized: true en next.config.ts) y las imágenes se sirven tal cual
  // se guardaron, sin recompresión del lado del servidor.
  const outputType = 'image/webp'
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, COMPRESS_JPEG_QUALITY)
  )

  if (!blob || blob.size >= file.size) return file

  const newName = file.name.replace(/\.\w+$/, '.webp')
  return new File([blob], newName, { type: outputType })
}

function compressImage(file: File): Promise<File> {
  return resizeImage(file, COMPRESS_MAX_DIMENSION, COMPRESS_SKIP_BELOW_BYTES)
}

/**
 * Genera una miniatura .webp de máx 600px para grillas/feed, donde la misma
 * foto se descarga muchas veces por vista. A diferencia de compressImage,
 * siempre re-codifica (nunca "da por bueno" el archivo original) así el
 * resultado es predeciblemente .webp — necesario para que getThumbnailUrl
 * pueda derivar el nombre del archivo sin consultar la base de datos.
 * Devuelve null para GIFs (se pierde la animación al recodificar) y cuando
 * el canvas no está disponible; en esos casos no se sube miniatura y
 * ProductImage cae de vuelta a la imagen grande.
 */
async function buildThumbnail(file: File): Promise<File | null> {
  if (file.type === 'image/gif') return null

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (error) {
    console.error('buildThumbnail: no pudimos leer la imagen', { error })
    return null
  }

  const scale = Math.min(1, THUMB_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return null
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', COMPRESS_JPEG_QUALITY)
  )
  if (!blob) return null

  const newName = file.name.replace(/\.\w+$/, `${THUMB_SUFFIX}.webp`)
  return new File([blob], newName, { type: 'image/webp' })
}

export function getThumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.replace(/\.\w+(\?.*)?$/, `${THUMB_SUFFIX}.webp$1`)
}

export async function uploadShopImage(
  bucket: 'shop-logos' | 'shop-covers' | 'product-images' | 'shop-promotions' | 'patient-photos',
  shopId: string,
  file: File
) {
  assertValidImage(bucket, file)
  const processedFile = await compressImage(file)

  const supabase = createClient()
  const extension = processedFile.name.split('.').pop() ?? 'jpg'
  const id = crypto.randomUUID()
  const path = `${shopId}/${id}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(path, processedFile, {
    upsert: false,
  })

  if (error) {
    console.error('uploadShopImage: fallo al subir a Storage', { bucket, shopId, error })
    throw new Error('No pudimos subir la imagen')
  }

  // Solo para fotos de producto: se ven repetidas veces en el feed/grilla en
  // tamaño chico, así que vale la pena una miniatura aparte para no gastar
  // ancho de banda sirviendo el archivo grande donde no hace falta.
  if (bucket === 'product-images') {
    const thumbFile = await buildThumbnail(file)
    const thumbPath = `${shopId}/${id}${THUMB_SUFFIX}.webp`
    const { error: thumbError } = thumbFile
      ? await supabase.storage.from(bucket).upload(thumbPath, thumbFile, { upsert: false })
      : { error: null }
    if (thumbError) {
      console.error('uploadShopImage: fallo al subir la miniatura (best effort)', {
        bucket,
        shopId,
        thumbError,
      })
    }
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

const SHOP_LANDING_VIDEO_MAX_DURATION_SECONDS = 20

export async function uploadShopLandingVideo(shopId: string, file: File) {
  if (!VIDEO_MIME_TYPES.includes(file.type)) {
    throw new Error('El video debe ser MP4, WEBM o MOV')
  }

  if (file.size > VIDEO_MAX_SIZE) {
    throw new Error(`El video no puede pesar más de ${VIDEO_MAX_SIZE / (1024 * 1024)}MB`)
  }

  const duration = await readVideoDuration(file)
  if (duration > SHOP_LANDING_VIDEO_MAX_DURATION_SECONDS) {
    throw new Error(`El video no puede durar más de ${SHOP_LANDING_VIDEO_MAX_DURATION_SECONDS} segundos`)
  }

  const supabase = createClient()
  const extension = file.name.split('.').pop() ?? 'mp4'
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('shop-landing-videos').upload(path, file, {
    upsert: false,
  })

  if (error) {
    console.error('uploadShopLandingVideo: fallo al subir a Storage', { shopId, error })
    throw new Error('No pudimos subir el video')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('shop-landing-videos').getPublicUrl(path)

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

/**
 * Adjunto del historial clínico de un paciente (foto o PDF). Clon exacto de
 * `uploadVerificationDocument` en cuanto a validación/límite (imagen o PDF,
 * 10MB), pero el path incluye `patientId` además de `shopId`
 * (`shopId/patientId/uuid.ext`) para poder scopear las policies de Storage
 * del bucket `patient-documents` por comercio Y filtrar por paciente si hace
 * falta más adelante — mismo criterio que `patient-photos`.
 */
export async function uploadPatientDocument(shopId: string, patientId: string, file: File) {
  if (!PATIENT_DOCUMENT_MIME_TYPES.includes(file.type)) {
    throw new Error('El documento debe ser una imagen o un PDF')
  }

  if (file.size > PATIENT_DOCUMENT_MAX_SIZE) {
    throw new Error('El documento no puede pesar más de 10MB')
  }

  const supabase = createClient()
  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${shopId}/${patientId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('patient-documents').upload(path, file, {
    upsert: false,
  })

  if (error) {
    console.error('uploadPatientDocument: fallo al subir a Storage', { shopId, patientId, error })
    throw new Error('No pudimos subir el documento')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('patient-documents').getPublicUrl(path)

  return publicUrl
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
