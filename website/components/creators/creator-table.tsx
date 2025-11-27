'use client'

import { CreatorWithOutreach, Creator, OUTREACH_STATUS_COLORS, OUTREACH_STATUS_LABELS } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Twitch, Music } from 'lucide-react'
import { SiTiktok, SiPatreon, SiBluesky } from 'react-icons/si'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface CreatorTableProps {
    creators: CreatorWithOutreach[]
    onUpdate: (creatorId: number, newStatus: string) => void
}

export function CreatorTable({ creators, onUpdate }: CreatorTableProps) {
    const [updating, setUpdating] = useState<number | null>(null)

    async function handleStatusChange(creatorId: number, newStatus: string) {
        setUpdating(creatorId)

        // Update UI immediately
        onUpdate(creatorId, newStatus)

        try {
            const response = await fetch('/api/creators/outreach', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    creatorId,
                    outreachStatus: newStatus
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status: ' + (error as Error).message)
        } finally {
            setUpdating(null)
        }
    } function getAvatarUrl(creator: Creator): string {
        const avatar = creator.avatar as any
        if (avatar?.thumb) return avatar.thumb
        if (avatar?.small) return avatar.small
        if (avatar?.medium) return avatar.medium
        return '/placeholder-avatar.png'
    }

    function getSocialMediaIcon(type: string, url: string) {
        const iconProps = { className: "w-4 h-4" }

        switch (type.toLowerCase()) {
            case 'instagram':
                return <Instagram {...iconProps} />
            case 'facebook':
                return <Facebook {...iconProps} />
            case 'twitter':
            case 'x':
                return <Twitter {...iconProps} />
            case 'youtube':
                return <Youtube {...iconProps} />
            case 'tiktok':
                return <SiTiktok {...iconProps} />
            case 'linkedin':
                return <Linkedin {...iconProps} />
            case 'patreon':
                return <SiPatreon {...iconProps} />
            case 'discord':
                return <MessageCircle {...iconProps} />
            case 'twitch':
                return <Twitch {...iconProps} />
            case 'bluesky':
                return <SiBluesky {...iconProps} />
            default:
                return <Globe {...iconProps} />
        }
    }

    function getFaviconUrl(domain: string): string {
        // Get favicon from domain using Google's favicon service
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Creator</TableHead>
                        <TableHead className="text-center">Projects</TableHead>
                        <TableHead className="text-center">Backed</TableHead>
                        <TableHead>Social & Websites</TableHead>
                        <TableHead className="w-[200px]">Contact Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {creators.map((creator) => {
                        const outreach = creator.creator_outreach
                        const websites = Array.isArray(creator.websites) ? creator.websites : []
                        const projectCount = creator.project_count || 0

                        return (
                            <TableRow key={creator.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 flex-shrink-0">
                                            <Image
                                                src={getAvatarUrl(creator)}
                                                alt={creator.name || 'Creator'}
                                                fill
                                                className="rounded-full object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/creators/${creator.id}`}
                                                className="font-medium line-clamp-1 hover:text-primary hover:underline"
                                            >
                                                {creator.name || 'Unnamed Creator'}
                                            </Link>
                                            <a
                                                href={`https://www.kickstarter.com/profile/${creator.slug || creator.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline truncate block"
                                            >
                                                @{creator.slug || creator.id}
                                            </a>
                                            {creator.is_superbacker && (
                                                <Badge variant="secondary" className="text-xs mt-1">
                                                    ⭐ Superbacker
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="font-medium">{projectCount}</div>
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="font-medium">{creator.backing_action_count || 0}</div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex gap-2 flex-wrap">
                                        {websites.map((site: any, idx: number) => {
                                            const type = site.type?.toLowerCase() || ''
                                            const isSocialMedia = ['instagram', 'facebook', 'twitter', 'x', 'youtube', 'tiktok', 'linkedin', 'patreon', 'discord', 'twitch', 'bluesky'].includes(type)

                                            return (
                                                <a
                                                    key={idx}
                                                    href={site.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-accent transition-colors"
                                                    title={site.domain || site.url}
                                                >
                                                    {isSocialMedia ? (
                                                        getSocialMediaIcon(type, site.url)
                                                    ) : (
                                                        <Image
                                                            src={getFaviconUrl(site.domain || new URL(site.url).hostname)}
                                                            alt={site.domain || 'Website'}
                                                            width={16}
                                                            height={16}
                                                            className="rounded"
                                                            unoptimized
                                                            onError={(e) => {
                                                                // Fallback to generic icon if favicon fails
                                                                (e.target as HTMLImageElement).style.display = 'none'
                                                                const parent = (e.target as HTMLElement).parentElement
                                                                if (parent && !parent.querySelector('svg')) {
                                                                    const icon = document.createElement('div')
                                                                    icon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>'
                                                                    parent.appendChild(icon.firstChild!)
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </a>
                                            )
                                        })}
                                        {websites.length === 0 && (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Select
                                        value={outreach?.outreach_status || 'not_contacted'}
                                        onValueChange={(value) => handleStatusChange(creator.id, value)}
                                        disabled={updating === creator.id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    <span className={`px-2 py-1 rounded text-xs ${OUTREACH_STATUS_COLORS[value as keyof typeof OUTREACH_STATUS_COLORS]}`}>
                                                        {label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
