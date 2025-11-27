'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Creator, CreatorOutreach, Project, OUTREACH_STATUS_LABELS, OUTREACH_STATUS_COLORS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ExternalLink, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SocialIcons } from '@/components/ui/social-icons'

export default function CreatorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [creator, setCreator] = useState<Creator | null>(null)
    const [outreach, setOutreach] = useState<CreatorOutreach | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCreator()
    }, [params.id])

    async function loadCreator() {
        setLoading(true)
        try {
            const response = await fetch(`/api/creators/${params.id}`)

            if (!response.ok) {
                throw new Error('Failed to load creator')
            }

            const { creator: creatorData, outreach: outreachData, projects: projectsData } = await response.json()

            setCreator(creatorData)
            setOutreach(outreachData)
            setProjects(projectsData || [])
        } catch (error) {
            console.error('Error loading creator:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!creator) return

        // Update local state immediately for instant feedback
        setOutreach(prev => prev ? {
            ...prev,
            outreach_status: newStatus as any,
            updated_at: new Date().toISOString()
        } : null)

        // Send to backend in background
        try {
            const response = await fetch('/api/creators/outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: creator.id, status: newStatus })
            })

            if (!response.ok) {
                throw new Error('Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
            // Reload on error to get correct state
            await loadCreator()
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="font-medium">Loading creator...</p>
                </div>
            </div>
        )
    }

    if (!creator) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Creator not found</h2>
                <Button onClick={() => router.push('/creators')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Creators
                </Button>
            </div>
        )
    }

    const avatar = creator.avatar as any
    const websites = Array.isArray(creator.websites) ? creator.websites : []

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push('/creators')
        }
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative w-32 h-32 mb-4">
                                    <Image
                                        src={avatar?.medium || avatar?.small || avatar?.thumb || '/placeholder-avatar.png'}
                                        alt={creator.name}
                                        fill
                                        className="rounded-full object-cover"
                                        unoptimized
                                    />
                                </div>
                                <h1 className="text-2xl font-bold mb-1">{creator.name}</h1>
                                <p className="text-muted-foreground mb-4">@{creator.slug || creator.id}</p>

                                <div className="flex flex-wrap gap-2 justify-center mb-4">
                                    {creator.is_superbacker && (
                                        <Badge variant="secondary">⭐ Superbacker</Badge>
                                    )}
                                    {creator.is_registered && (
                                        <Badge variant="outline">Registered</Badge>
                                    )}
                                    {creator.is_email_verified && (
                                        <Badge variant="outline">Email Verified</Badge>
                                    )}
                                </div>

                                <a
                                    href={`https://www.kickstarter.com/profile/${creator.slug || creator.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
                                >
                                    View on Kickstarter
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold">{projects.length}</div>
                                        <div className="text-sm text-muted-foreground">Projects</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{creator.backing_action_count || 0}</div>
                                        <div className="text-sm text-muted-foreground">Backed</div>
                                    </div>
                                </div>

                                {creator.chosen_currency && (
                                    <div className="text-center pt-4 border-t">
                                        <div className="text-sm text-muted-foreground">Currency</div>
                                        <div className="font-medium">{creator.chosen_currency}</div>
                                    </div>
                                )}
                            </div>

                            {/* Social Media Icons */}
                            <div className="border-t pt-6">
                                <div className="flex items-center gap-2 text-sm font-medium mb-4">
                                    <Globe className="h-4 w-4" />
                                    Social Media & Websites
                                </div>
                                <SocialIcons
                                    urls={creator.urls as any}
                                    websites={creator.websites as any}
                                    size="md"
                                    showLabels={true}
                                />
                            </div>

                            {outreach && (
                                <div className="border-t pt-6">
                                    <div className="text-sm font-medium mb-3">Contact Status</div>

                                    <Select
                                        value={outreach.outreach_status || 'not_contacted'}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {outreach.last_contacted_at && (
                                        <div className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                                            Last contact: {new Date(outreach.last_contacted_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Projects ({projects.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {projects.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No projects found
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {projects.map((project) => {
                                        const photo = project.photo as any
                                        const imageUrl = photo?.small || photo?.thumb || '/placeholder-project.png'

                                        return (
                                            <Link
                                                key={project.id}
                                                href={`/projects/${project.id}`}
                                                className="flex gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                                            >
                                                <div className="relative w-24 h-24 flex-shrink-0">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={project.name}
                                                        fill
                                                        className="object-cover rounded"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold line-clamp-1 mb-1">{project.name}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                        {project.blurb}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {project.state}
                                                        </Badge>
                                                        <span className="text-sm font-medium">
                                                            {project.currency_symbol}{project.pledged.toLocaleString()}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {project.percent_funded}% funded
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
