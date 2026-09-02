import type { SVGProps } from 'react'
type P = SVGProps<SVGSVGElement> & { size?: number }
function I({ size = 20, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>{children}</svg>
  )
}
export const IconHome = (p: P) => <I {...p}><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 10.5V20h11V10.5" /></I>
export const IconCompass = (p: P) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 7-7 2 2-7 7-2z" /></I>
export const IconPlus = (p: P) => <I {...p}><path d="M12 6v12M6 12h12" /></I>
export const IconBell = (p: P) => <I {...p}><path d="M6 16h12l-1.2-2.1a6.2 6.2 0 0 1-.8-3.1V9a5 5 0 0 1 10 0v1.8c0 1.1-.3 2.2-.8 3.1L18 16" /><path d="M10 16a2 2 0 0 0 4 0" /></I>
export const IconUser = (p: P) => <I {...p}><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" /></I>
export const IconWallet = (p: P) => <I {...p}><rect x="3.5" y="7" width="17" height="12" rx="2" /><path d="M3.5 10h17" /><circle cx="16.2" cy="14.2" r="1" /></I>
export const IconBack = (p: P) => <I {...p}><path d="M15 6l-6 6 6 6" /></I>
export const IconChat = (p: P) => <I {...p}><path d="M5 17.5 4 21l3.8-1.4A8.5 8.5 0 1 0 5 17.5z" /></I>
export const IconShield = (p: P) => <I {...p}><path d="M12 3.5 5 6.2v5.4c0 4.2 2.8 7.2 7 8.9 4.2-1.7 7-4.7 7-8.9V6.2L12 3.5z" /></I>
export const IconFlame = (p: P) => <I {...p}><path d="M12 3s2.2 3.2 2.2 5.4c0 1.2-.6 2-1.5 2.6 2.2-.2 4.3 1.4 4.3 4 0 2.6-2.2 5-5 5s-5-2.4-5-5c0-3.6 3.2-6.4 5-12z" /></I>
export const IconTrophy = (p: P) => <I {...p}><path d="M8 5h8v3a4 4 0 0 1-8 0V5z" /><path d="M8 6H5.5A2.5 2.5 0 0 0 8 9.2M16 6h2.5A2.5 2.5 0 0 1 16 9.2" /><path d="M12 12v3M9 20h6M10 17h4" /></I>
export const IconFlag = (p: P) => <I {...p}><path d="M6 4v16M6 5h11l-2 3.5L17 12H6" /></I>
export const IconLoop = (p: P) => <I {...p}><path d="M7 7h7a4 4 0 0 1 0 8h-1" /><path d="M9 5 7 7l2 2" /><path d="M17 17H10a4 4 0 0 1 0-8h1" /><path d="m15 19 2-2-2-2" /></I>
export const IconCamera = (p: P) => <I {...p}><path d="M8 8 9.2 6h5.6L16 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3z" /><circle cx="12" cy="13" r="3" /></I>
