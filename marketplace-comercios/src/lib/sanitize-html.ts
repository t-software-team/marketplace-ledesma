import sanitizeHtml from 'sanitize-html'

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  })
}
