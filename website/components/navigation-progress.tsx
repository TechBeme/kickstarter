'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // When pathname changes, hide loading immediately
        // This means the new page has started rendering
        setLoading(false)
    }, [pathname, searchParams])

    useEffect(() => {
        // Intercept ALL clicks on the document to show loading IMMEDIATELY
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement

            // Find the closest anchor tag
            const link = target.closest('a')

            if (link && link.href) {
                try {
                    const url = new URL(link.href)
                    const currentUrl = new URL(window.location.href)

                    // Check if it's an internal navigation (same origin, different path)
                    if (
                        url.origin === currentUrl.origin &&
                        (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) &&
                        !link.target && // Not opening in new tab
                        !link.download && // Not a download link
                        !link.getAttribute('href')?.startsWith('#') // Not a hash link
                    ) {
                        // Show loading IMMEDIATELY
                        setLoading(true)
                    }
                } catch (err) {
                    // Invalid URL, ignore
                }
            }
        }

        // Use capture phase to intercept clicks before they bubble
        document.addEventListener('click', handleClick, { capture: true })

        return () => {
            document.removeEventListener('click', handleClick, { capture: true })
        }
    }, [])

    if (!loading) return null

    return (
        <>
            {/* Full page overlay with spinner */}
            <div className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-medium text-foreground">Loading...</p>
                </div>
            </div>
        </>
    )
}