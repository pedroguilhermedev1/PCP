import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set initial value inside useEffect, but properly initialize with function or just use mql matches
    // Avoid synchronous state updates right inside body
    const update = () => setIsMobile(mql.matches)
    
    // Set initial state
    update()

    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  return !!isMobile
}
