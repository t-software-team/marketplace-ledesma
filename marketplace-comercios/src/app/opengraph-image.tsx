import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logoData = await readFile(join(process.cwd(), 'public/brand/logo.png'))
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          background: '#ffffff',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={220} height={220} alt="" />
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: -1,
          }}
        >
          Proxi Marketplace
        </div>
      </div>
    ),
    { ...size }
  )
}
