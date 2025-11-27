"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjectWithCreator, OUTREACH_STATUS_LABELS, OUTREACH_STATUS_COLORS, OutreachStatus } from '@/lib/types'
import { formatCurrency, formatPercent, formatDate, getImageUrl, getCategoryName } from '@/lib/utils/format'
import { SocialIcons } from '@/components/ui/social-icons'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, User, MapPin, Calendar, Target, TrendingUp } from 'lucide-react'

interface ProjectGridProps {
    projects: ProjectWithCreator[]
    onStatusChange?: (projectId: number, creatorId: number, newStatus: OutreachStatus) => void
}

export function ProjectGrid({ projects, onStatusChange }: ProjectGridProps) {
    const [updating, setUpdating] = useState<Record<number, boolean>>({})

    const handleStatusChange = async (projectId: number, creatorId: number, newStatus: OutreachStatus) => {
        setUpdating(prev => ({ ...prev, [creatorId]: true }))

        // Update UI immediately
        if (onStatusChange) onStatusChange(projectId, creatorId, newStatus)

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
            setUpdating(prev => ({ ...prev, [creatorId]: false }))
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
                const imageUrl = getImageUrl(project.photo, 'med')
                const category = getCategoryName(project.category)
                const outreach = project.creator_outreach
                const currentStatus = (outreach?.outreach_status || 'not_contacted') as OutreachStatus

                return (
                    <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader className="p-0">
                            <div className="relative h-48 w-full bg-gray-100">
                                <Image
                                    src={imageUrl}
                                    alt={project.name}
                                    fill
                                    className="object-cover rounded-t-lg"
                                    unoptimized
                                />
                                {project.staff_pick && (
                                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                                        Staff Pick
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 pt-4 space-y-3">
                            <div>
                                <Link href={`/projects/${project.id}`}>
                                    <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                                        {project.name}
                                    </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {project.blurb}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <Link href={`/creators/${project.creator_id}`} className="hover:text-blue-600">
                                    {project.creator?.name || 'Unknown'}
                                </Link>
                            </div>

                            {/* Social Media Icons */}
                            {project.creator?.urls && (
                                <div className="pt-1">
                                    <SocialIcons
                                        urls={project.creator.urls}
                                        websites={project.creator.websites as any}
                                        size="sm"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Pledged</span>
                                    <span className="font-semibold">
                                        {formatCurrency(project.pledged, project.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Goal</span>
                                    <span>{formatCurrency(project.goal, project.currency)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${Math.min(project.percent_funded, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {project.backers_count.toLocaleString()} backers
                                    </span>
                                    <span className="font-semibold text-green-600">
                                        {formatPercent(project.percent_funded)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {project.state}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {project.country}
                                </Badge>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-2 pt-0">
                            <div className="w-full">
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    Contact Status
                                </label>
                                <Select
                                    value={currentStatus}
                                    onValueChange={(value) => handleStatusChange(project.id, project.creator_id, value as OutreachStatus)}
                                    disabled={updating[project.creator_id]}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                <span className={`px-2 py-1 rounded text-xs ${OUTREACH_STATUS_COLORS[value as OutreachStatus]}`}>
                                                    {label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}
