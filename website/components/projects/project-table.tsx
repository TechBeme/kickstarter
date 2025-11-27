"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjectWithCreator, OUTREACH_STATUS_LABELS, OUTREACH_STATUS_COLORS, OutreachStatus } from '@/lib/types'
import { formatCurrency, formatPercent, formatDate, getCategoryName } from '@/lib/utils/format'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface ProjectTableProps {
    projects: ProjectWithCreator[]
    onStatusChange?: (projectId: number, creatorId: number, newStatus: OutreachStatus) => void
}

export function ProjectTable({ projects, onStatusChange }: ProjectTableProps) {
    const [updating, setUpdating] = useState<Record<number, boolean>>({})

    const handleStatusChange = async (projectId: number, creatorId: number, newStatus: OutreachStatus) => {
        setUpdating(prev => ({ ...prev, [creatorId]: true }))
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
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Project</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead className="text-right">Goal</TableHead>
                        <TableHead className="text-right">Backers</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="w-[200px]">Contact Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        const category = getCategoryName(project.category)
                        const outreach = project.creator_outreach
                        const currentStatus = (outreach?.outreach_status || 'not_contacted') as OutreachStatus

                        return (
                            <TableRow key={project.id}>
                                <TableCell>
                                    <Link href={`/projects/${project.id}`} className="hover:text-blue-600">
                                        <div className="font-medium line-clamp-2">{project.name}</div>
                                    </Link>
                                    {project.staff_pick && (
                                        <Badge variant="secondary" className="mt-1 text-xs">Staff Pick</Badge>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <Link href={`/creators/${project.creator_id}`} className="hover:text-blue-600">
                                        {project.creator?.name || 'Unknown'}
                                    </Link>
                                </TableCell>

                                <TableCell className="text-right">
                                    {formatCurrency(project.goal, project.currency)}
                                </TableCell>

                                <TableCell className="text-right">
                                    {project.backers_count.toLocaleString()}
                                </TableCell>

                                <TableCell>
                                    <Badge variant="outline">{project.state}</Badge>
                                </TableCell>

                                <TableCell>
                                    <span className="text-sm">{category}</span>
                                </TableCell>

                                <TableCell>
                                    <span className="text-sm">{project.country_displayable_name || project.country}</span>
                                </TableCell>

                                <TableCell>
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
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
