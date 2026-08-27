function IllustrationBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className="mx-auto size-20"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

export function EmptySearchIllustration() {
  return (
    <IllustrationBase>
      <circle cx="40" cy="40" r="24" className="fill-muted stroke-border" strokeWidth="2" />
      <circle cx="40" cy="40" r="24" className="stroke-primary" strokeWidth="2" strokeDasharray="4 6" />
      <line
        x1="58"
        y1="58"
        x2="76"
        y2="76"
        className="stroke-muted-foreground"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </IllustrationBase>
  )
}

export function EmptyBoxIllustration() {
  return (
    <IllustrationBase>
      <path
        d="M20 38 L48 26 L76 38 L76 68 L48 80 L20 68 Z"
        className="fill-muted stroke-border"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 38 L48 50 L76 38" className="stroke-border" strokeWidth="2" strokeLinejoin="round" />
      <line x1="48" y1="50" x2="48" y2="80" className="stroke-border" strokeWidth="2" />
      <circle cx="48" cy="50" r="6" className="fill-destacado" />
    </IllustrationBase>
  )
}

export function EmptyHeartIllustration() {
  return (
    <IllustrationBase>
      <path
        d="M48 72 C24 56 16 42 16 30 C16 20 24 14 32 14 C39 14 45 18 48 24 C51 18 57 14 64 14 C72 14 80 20 80 30 C80 42 72 56 48 72 Z"
        className="fill-verified/20 stroke-verified"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </IllustrationBase>
  )
}

export function EmptyDumbbellIllustration() {
  return (
    <IllustrationBase>
      {/* barra central */}
      <rect x="30" y="44" width="36" height="8" rx="4" className="fill-destacado" />
      {/* placas internas */}
      <rect x="24" y="34" width="8" height="28" rx="3" className="fill-muted stroke-border" strokeWidth="2" />
      <rect x="64" y="34" width="8" height="28" rx="3" className="fill-muted stroke-border" strokeWidth="2" />
      {/* placas externas */}
      <rect x="14" y="38" width="8" height="20" rx="3" className="fill-muted stroke-border" strokeWidth="2" />
      <rect x="74" y="38" width="8" height="20" rx="3" className="fill-muted stroke-border" strokeWidth="2" />
    </IllustrationBase>
  )
}

export function EmptyBellIllustration() {
  return (
    <IllustrationBase>
      <path
        d="M48 20 C36 20 30 30 30 42 L30 54 L24 64 L72 64 L66 54 L66 42 C66 30 60 20 48 20 Z"
        className="fill-muted stroke-border"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M40 70 C40 75 44 78 48 78 C52 78 56 75 56 70" className="stroke-border" strokeWidth="2" />
      <circle cx="68" cy="26" r="6" className="fill-destacado" />
    </IllustrationBase>
  )
}
