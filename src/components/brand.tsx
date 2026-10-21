export function BrandMark({ className = "", size = 44 }: { className?: string; size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="30.2" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    <circle cx="32" cy="32" r="26.4" stroke="currentColor" strokeWidth=".55" opacity=".3"/>
    <path d="M23.4 45V19.6h8.9c4.6 0 7.5 2.6 7.5 6.8 0 4.3-3 7-7.7 7h-4.6V45h-4.1Zm4.1-14.9h4.2c2.6 0 4-1.3 4-3.6s-1.4-3.5-4-3.5h-4.2v7.1Z" fill="currentColor"/>
    <path d="M33.6 45.4 27 19.6h4.3l4.9 20 5-20h4.2L38.6 45.4h-5Z" fill="currentColor" opacity=".55"/>
  </svg>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return <a href="#inicio" className={`brand ${light ? "brand-light" : ""}`} aria-label="Salón de Belleza Pamela Viury, inicio">
    <BrandMark/>
    <span className="brand-type">
      <span className="brand-kicker">SALÓN DE BELLEZA</span>
      <span className="brand-name">Pamela Viury</span>
      <span className="brand-description">CIUDAD JUÁREZ</span>
    </span>
  </a>;
}
