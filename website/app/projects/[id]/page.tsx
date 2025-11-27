'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Project, Creator, CreatorOutreach, OUTREACH_STATUS_LABELS, OUTREACH_STATUS_COLORS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ExternalLink, MapPin, Calendar, Target, TrendingUp, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SocialIcons } from '@/components/ui/social-icons'

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [creator, setCreator] = useState<Creator | null>(null)
    const [outreach, setOutreach] = useState<CreatorOutreach | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProject()
    }, [params.id])

    async function loadProject() {
        setLoading(true)
        try {
            const response = await fetch(`/api/projects/${params.id}`)

            if (!response.ok) {
                throw new Error('Failed to load project')
            }

            const { project: projectData, creator: creatorData, outreach: outreachData } = await response.json()

            setProject(projectData)
            setCreator(creatorData)
            setOutreach(outreachData)
        } catch (error) {
            console.error('Error loading project:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!project) return

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
                body: JSON.stringify({ creatorId: project.creator_id, status: newStatus })
            })

            if (!response.ok) {
                throw new Error('Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
            // Reload on error to get correct state
            await loadProject()
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
                    <p className="font-medium">Loading project...</p>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Project not found</h2>
                <Button onClick={() => router.push('/projects')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                </Button>
            </div>
        )
    }

    const photo = project.photo as any
    const imageUrl = photo?.full || photo?.['1024x576'] || photo?.med || photo?.small || '/placeholder-project.png'
    const category = project.category as any
    const location = project.location as any

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push('/projects')
        }
    }

    return (
        <div className="space-y-6">
            <Button
                variant="ghost"
                onClick={handleBack}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-0">
                            <div className="relative w-full h-96">
                                <Image
                                    src={imageUrl}
                                    alt={project.name}
                                    fill
                                    className="object-cover rounded-t-lg"
                                    unoptimized
                                />
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                                        <p className="text-muted-foreground">{project.blurb}</p>
                                    </div>
                                    {project.staff_pick && (
                                        <Badge className="bg-orange-500">Staff Pick</Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{project.state}</Badge>
                                    {category?.name && (
                                        <Badge variant="outline">{category.name}</Badge>
                                    )}
                                    <Badge variant="outline">{project.country}</Badge>
                                </div>

                                {location?.displayable_name && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {location.displayable_name}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <div className="text-sm text-muted-foreground">Goal</div>
                                        <div className="text-2xl font-bold">
                                            {project.currency_symbol}{project.goal.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <div className="text-sm text-muted-foreground">Pledged</div>
                                        <div className="text-2xl font-bold">
                                            {project.currency_symbol}{project.pledged.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-green-600">
                                            {project.percent_funded}% funded
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <div className="text-sm text-muted-foreground">Backers</div>
                                        <div className="text-2xl font-bold">
                                            {project.backers_count.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <div className="text-sm text-muted-foreground">Launched</div>
                                        <div className="font-medium">
                                            {project.launched_at ? new Date(project.launched_at * 1000).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(project.percent_funded, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {project.urls && (
                                <div className="pt-4">
                                    <a
                                        href={(project.urls as any)?.web?.project}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline"
                                    >
                                        View on Kickstarter
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {creator && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Creator</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <Image
                                            src={(creator.avatar as any)?.thumb || '/placeholder-avatar.png'}
                                            alt={creator.name}
                                            fill
                                            className="rounded-full object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/creators/${creator.id}`}
                                            className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2"
                                        >
                                            {creator.name}
                                        </Link>
                                        {creator.slug && (
                                            <div className="text-sm text-muted-foreground">@{creator.slug}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {creator.is_superbacker && (
                                        <Badge variant="secondary">⭐ Superbacker</Badge>
                                    )}
                                    {creator.is_registered && (
                                        <Badge variant="outline">Registered</Badge>
                                    )}
                                </div>

                                {/* Social Media Icons */}
                                <SocialIcons
                                    urls={creator.urls as any}
                                    websites={creator.websites as any}
                                    size="sm"
                                />

                                {creator.slug && (
                                    <a
                                        href={`https://www.kickstarter.com/profile/${creator.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        View profile on Kickstarter
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {outreach && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                    <div className="text-sm text-muted-foreground pt-2 border-t">
                                        Last contact: {new Date(outreach.last_contacted_at).toLocaleDateString()}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
