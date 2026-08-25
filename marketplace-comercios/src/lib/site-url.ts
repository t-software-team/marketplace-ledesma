export function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  // Strip trailing slashes so callers can safely do `${getBaseUrl()}/path`
  // without producing a double slash when the env var ends in "/".
  return url.replace(/\/+$/, '')
}
