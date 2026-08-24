'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const SPLASH_DURATION_MS = 1000
const SPLASH_SEEN_KEY = 'splash-seen'

const SPLASH_ID = 'splash-screen'

export function SplashScreen() {
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    // El script inline de abajo ya ocultó el splash de forma síncrona (antes
    // de la hidratación) si el usuario ya lo había visto. Si seguimos acá es
    // porque es la primera vez: programamos el fade-out y lo removemos del DOM.
    if (localStorage.getItem(SPLASH_SEEN_KEY)) return
    localStorage.setItem(SPLASH_SEEN_KEY, '1')

    const fadeTimer = setTimeout(() => setFadingOut(true), SPLASH_DURATION_MS)
    const hideTimer = setTimeout(() => {
      document.getElementById(SPLASH_ID)?.remove()
    }, SPLASH_DURATION_MS + 300)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <>
      <div
        id={SPLASH_ID}
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background transition-opacity duration-300 ${
          fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        <div className="relative h-28 w-28 animate-in zoom-in-75 fade-in duration-500 ease-out">
          <Image src="/brand/logo.png" alt="" fill sizes="112px" className="object-contain" priority />
        </div>
        <span className="animate-in fade-in slide-in-from-bottom-2 font-heading text-xl font-semibold text-foreground duration-500 delay-150 fill-mode-both">
          Proxi Marketplace
        </span>
      </div>
      {/* Corre de forma síncrona durante el parseo del HTML (justo después del
          div de arriba), antes de que cargue e hidrate el bundle de React.
          Sin esto, el overlay tapa el LCP hasta que termina la hidratación
          completa (~650ms medidos). Tiene que ir DESPUÉS del div: un <script>
          se ejecuta en cuanto el parser lo encuentra, así que si fuera antes,
          el div todavía no existiría en el DOM y getElementById fallaría. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('${SPLASH_SEEN_KEY}')){document.getElementById('${SPLASH_ID}').style.display='none'}}catch(e){}`,
        }}
      />
    </>
  )
}
