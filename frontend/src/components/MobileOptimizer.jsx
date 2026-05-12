import { createContext, useContext, useEffect, useState, useRef } from 'react'

const MobileContext = createContext({ isMobile: false, isMobileDevice: false })

export function useMobileOptimizer() {
  return useContext(MobileContext)
}

export default function MobileOptimizer({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    const ua = navigator.userAgent.toLowerCase()
    setIsMobileDevice(
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
    )
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
    const handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        const event = new CustomEvent('swipe', {
          detail: { direction: dx > 0 ? 'right' : 'left', dx, dy },
        })
        window.dispatchEvent(event)
      }
    }
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])

  return (
    <MobileContext.Provider value={{ isMobile, isMobileDevice }}>
      {children}
    </MobileContext.Provider>
  )
}
