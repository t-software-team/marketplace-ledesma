const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])

/**
 * Determina si un adjunto es una imagen según la extensión del nombre de
 * archivo (no hay columna de mime type real). Mismo set de formatos que
 * `ALLOWED_ATTACHMENT_TYPES` en `add-note-dialog.tsx` (png/jpg/jpeg/webp/gif),
 * excluyendo `application/pdf`. Sin extensión o extensión desconocida → no es
 * imagen (se muestra el link plano, nunca falla).
 */
export function isImageAttachment(fileName: string): boolean {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === fileName.length - 1) return false
  const extension = fileName.slice(lastDot + 1).toLowerCase()
  return IMAGE_EXTENSIONS.has(extension)
}
