"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Folder, Users, Home } from 'lucide-react'
import { KickstarterLogo } from '@/components/ui/kickstarter-logo'

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-center">
          <div className="flex gap-1">
            <Link href="/">
              <Button
                variant={pathname === '/' ? 'default' : 'ghost'}
                className={pathname === '/' ? 'gap-2 bg-black hover:bg-black/90' : 'gap-2'}
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/projects">
              <Button
                variant={isActive('/projects') ? 'default' : 'ghost'}
                className={isActive('/projects') ? 'gap-2 bg-black hover:bg-black/90' : 'gap-2'}
              >
                <Folder className="h-4 w-4" />
                Projects
              </Button>
            </Link>
            <Link href="/creators">
              <Button
                variant={isActive('/creators') ? 'default' : 'ghost'}
                className={isActive('/creators') ? 'gap-2 bg-black hover:bg-black/90' : 'gap-2'}
              >
                <Users className="h-4 w-4" />
                Creators
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}