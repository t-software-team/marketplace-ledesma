// Genera miniaturas (-thumb.webp, máx 600px) para las fotos de producto que
// ya estaban en Storage antes de que uploadShopImage empezara a subirlas
// automáticamente. Corre una sola vez.
//
// Uso: node --env-file=.env.local scripts/backfill-product-thumbnails.mjs
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const BUCKET = 'product-images'
const THUMB_MAX_DIMENSION = 600
const THUMB_QUALITY = 82
const PAGE_SIZE = 500

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function pathFromPublicUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

function thumbPathFor(path) {
  return path.replace(/\.\w+$/, '-thumb.webp')
}

async function thumbAlreadyExists(thumbPath) {
  const dir = thumbPath.split('/').slice(0, -1).join('/')
  const filename = thumbPath.split('/').pop()
  const { data, error } = await supabase.storage.from(BUCKET).list(dir, { search: filename })
  if (error) return false
  return data.some((entry) => entry.name === filename)
}

async function main() {
  let offset = 0
  let processed = 0
  let created = 0
  let skipped = 0
  let failed = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('product_images')
      .select('id, url')
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('Error leyendo product_images:', error)
      process.exit(1)
    }
    if (!rows || rows.length === 0) break

    for (const row of rows) {
      processed += 1
      const path = pathFromPublicUrl(row.url)

      if (!path || path.endsWith('.gif')) {
        skipped += 1
        continue
      }

      const thumbPath = thumbPathFor(path)

      try {
        if (await thumbAlreadyExists(thumbPath)) {
          skipped += 1
          continue
        }

        const { data: original, error: downloadError } = await supabase.storage
          .from(BUCKET)
          .download(path)
        if (downloadError || !original) {
          console.error(`  fallo al descargar ${path}:`, downloadError)
          failed += 1
          continue
        }

        const buffer = Buffer.from(await original.arrayBuffer())
        const thumbBuffer = await sharp(buffer)
          .resize({
            width: THUMB_MAX_DIMENSION,
            height: THUMB_MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: THUMB_QUALITY })
          .toBuffer()

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(thumbPath, thumbBuffer, { contentType: 'image/webp', upsert: false })

        if (uploadError) {
          console.error(`  fallo al subir miniatura ${thumbPath}:`, uploadError)
          failed += 1
          continue
        }

        created += 1
        if (created % 25 === 0) console.log(`  ${created} miniaturas creadas...`)
      } catch (err) {
        console.error(`  error inesperado con ${row.id}:`, err)
        failed += 1
      }
    }

    offset += PAGE_SIZE
  }

  console.log(`\nListo. Procesadas: ${processed} | Creadas: ${created} | Saltadas: ${skipped} | Fallidas: ${failed}`)
}

main()
