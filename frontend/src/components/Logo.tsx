interface LogoProps {
  size?: number
}

export default function Logo({ size = 40 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b"/>
          <stop offset="100%" stopColor="#0f0f1a"/>
        </linearGradient>
        <linearGradient id="logoArc" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c6af7"/>
          <stop offset="100%" stopColor="#10b981"/>
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="logoSoftGlow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="200" height="200" rx="42" fill="url(#logoBg)"/>
      <circle cx="100" cy="80" r="80" fill="rgba(124,106,247,0.08)"/>
      <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
      <circle cx="100" cy="100" r="62" fill="none"
        stroke="url(#logoArc)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray="292 98"
        transform="rotate(-90 100 100)"
        filter="url(#logoGlow)"/>
      <circle cx="100" cy="38" r="5" fill="#10b981"
        transform="rotate(180 100 100)" filter="url(#logoGlow)"/>
      <path d="M108 63 L83 105 H99 L89 141 L118 97 H102 Z"
        fill="white" opacity="0.95" filter="url(#logoSoftGlow)"/>
    </svg>
  )
}
