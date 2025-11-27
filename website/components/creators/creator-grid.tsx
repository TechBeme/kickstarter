'use client'

import { CreatorWithOutreach, Creator, OUTREACH_STATUS_COLORS, OUTREACH_STATUS_LABELS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SocialIcons } from '@/components/ui/social-icons'
import { MapPin, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface CreatorGridProps {
    creators: CreatorWithOutreach[]
    onUpdate: (creatorId: number, newStatus: string) => void
}

export function CreatorGrid({ creators, onUpdate }: CreatorGridProps) {
    const [updating, setUpdating] = useState<number | null>(null)

    async function handleStatusChange(creatorId: number, newStatus: string) {
        setUpdating(creatorId)
        onUpdate(creatorId, newStatus)

        try {
            const response = await fetch('/api/creators/outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId, status: newStatus })
            })

            if (!response.ok) {
                throw new Error('Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
        } finally {
            setUpdating(null)
        }
    }

    function getAvatarUrl(creator: Creator): string {
        const avatar = creator.avatar as any
        if (avatar?.thumb) return avatar.thumb
        if (avatar?.small) return avatar.small
        if (avatar?.medium) return avatar.medium
        return '/placeholder-avatar.png'
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creators.map((creator) => {
                const outreach = creator.creator_outreach
                const websites = Array.isArray(creator.websites) ? creator.websites : []

                return (
                    <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                    <Image
                                        src={getAvatarUrl(creator)}
                                        alt={creator.name || 'Creator'}
                                        fill
                                        className="rounded-full object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base line-clamp-2 break-words">
                                        <Link
                                            href={`/creators/${creator.id}`}
                                            className="hover:text-primary transition-colors"
                                        >
                                            {creator.name || 'Unnamed Creator'}
                                        </Link>
                                    </CardTitle>
                                    <a
                                        href={`https://www.kickstarter.com/profile/${creator.slug || creator.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 break-all"
                                    >
                                        @{creator.slug || creator.id}
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {/* Social Media Icons */}
                            {(creator.urls || websites.length > 0) && (
                                <div className="pb-3 border-b">
                                    <SocialIcons
                                        urls={creator.urls}
                                        websites={websites}
                                        size="md"
                                    />
                                </div>
                            )}

                            {/* Stats - Projects and Backed */}
                            <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-primary">
                                        {creator.project_count || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Projects</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-primary">
                                        {creator.backing_action_count || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Backed</div>
                                </div>
                            </div>

                            {/* Badges */}
                            {(creator.is_superbacker || creator.is_registered) && (
                                <div className="flex flex-wrap gap-2">
                                    {creator.is_superbacker && (
                                        <Badge variant="secondary" className="text-xs">
                                            ⭐ Superbacker
                                        </Badge>
                                    )}
                                    {creator.is_registered && (
                                        <Badge variant="outline" className="text-xs">
                                            Registered
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Contact Status */}
                            <div className={creator.is_superbacker || creator.is_registered ? "pt-3 border-t" : ""}>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    Contact Status
                                </label>
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
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
