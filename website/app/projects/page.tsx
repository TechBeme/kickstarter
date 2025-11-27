'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ProjectWithCreator } from '@/lib/types'
import { ProjectGrid } from '@/components/projects/project-grid'
import { ProjectTable } from '@/components/projects/project-table'
import { ProjectFiltersComponent, ProjectFilters } from '@/components/projects/project-filters'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Table, Download, Loader2 } from 'lucide-react'
import { exportToExcel, formatCurrencyForExcel, formatDateForExcel } from '@/lib/utils/excel-export'
import { ExportDialog } from '@/components/ui/export-dialog'

const PAGE_SIZE = 50

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithCreator[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'confirming' | 'exporting' | 'success' | 'error'>('idle')
  const [exportedCount, setExportedCount] = useState(0)
  const [exportError, setExportError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const initialLoadDone = useRef(false)

  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    state: null,
    country: null,
    category: null,
    minGoal: null,
    maxGoal: null,
    minPercent: null,
    staffPick: null,
    hasInstagram: null,
    hasFacebook: null,
    hasTwitter: null,
    hasYoutube: null,
    hasTiktok: null,
    hasLinkedin: null,
    hasPatreon: null,
    hasDiscord: null,
    hasTwitch: null,
    hasBluesky: null,
    hasOtherWebsite: null,
    outreachStatus: null
  })

  const [countries, setCountries] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Load initial data (metadata + first page of projects)
  useEffect(() => {
    loadInitialData()
  }, [])

  // Reset and reload when filters change
  useEffect(() => {
    // Only skip initial render, allow filter changes to trigger reload
    if (initialLoadDone.current) {
      setProjects([]) // Clear projects to show spinner
      setPage(0)
      setHasMore(true)
      loadProjects(0, true, true) // Pass true to replace current projects
    }
  }, [filters])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page])

  async function loadInitialData() {
    setLoading(true)
    try {
      // Fetch metadata from API
      const metaResponse = await fetch('/api/projects/metadata')

      if (metaResponse.ok) {
        const metadata = await metaResponse.json()
        setCountries(metadata.countries || [])
        setCategories(metadata.categories || [])
      }

      // Load first page of projects
      await loadProjects(0, true)
      initialLoadDone.current = true
      setLoading(false) // Initial load complete
    } catch (error) {
      console.error('Error loading initial data:', error)
      setLoading(false)
      initialLoadDone.current = true
    }
  }

  async function loadProjects(pageNum: number, isNewFilter = false, replaceProjects = false) {
    // Always use loadingMore for better UX - keeps UI stable
    setLoadingMore(true)

    try {
      const offset = pageNum * PAGE_SIZE

      // Build query params
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: offset.toString()
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.state) params.append('state', filters.state)
      if (filters.country) params.append('country', filters.country)
      if (filters.category) params.append('category', filters.category)
      if (filters.minGoal !== null) params.append('minGoal', filters.minGoal.toString())
      if (filters.maxGoal !== null) params.append('maxGoal', filters.maxGoal.toString())
      if (filters.minPercent !== null) params.append('minPercent', filters.minPercent.toString())
      if (filters.staffPick !== null) params.append('staffPick', filters.staffPick.toString())
      if (filters.outreachStatus) params.append('outreachStatus', filters.outreachStatus)
      if (filters.hasInstagram) params.append('hasInstagram', 'true')
      if (filters.hasFacebook) params.append('hasFacebook', 'true')
      if (filters.hasTwitter) params.append('hasTwitter', 'true')
      if (filters.hasYoutube) params.append('hasYoutube', 'true')
      if (filters.hasTiktok) params.append('hasTiktok', 'true')
      if (filters.hasLinkedin) params.append('hasLinkedin', 'true')
      if (filters.hasPatreon) params.append('hasPatreon', 'true')
      if (filters.hasDiscord) params.append('hasDiscord', 'true')
      if (filters.hasTwitch) params.append('hasTwitch', 'true')
      if (filters.hasBluesky) params.append('hasBluesky', 'true')
      if (filters.hasOtherWebsite) params.append('hasOtherWebsite', 'true')

      const response = await fetch(`/api/projects?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const { data, total_count } = await response.json()

      if (!data || data.length === 0) {
        setHasMore(false)
        setTotalCount(0)
        if (isNewFilter) {
          setProjects([])
        }
        return
      }

      // Set total count
      setTotalCount(total_count || 0)

      // Transform API response to ProjectWithCreator format
      const projectsData: ProjectWithCreator[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        blurb: row.blurb,
        goal: row.goal,
        pledged: row.pledged,
        state: row.state,
        country: row.country,
        country_displayable_name: row.country_displayable_name,
        currency: row.currency,
        deadline: row.deadline,
        created_at_ks: row.created_at_ks,
        launched_at: row.launched_at,
        state_changed_at: row.state_changed_at,
        creator_id: row.creator_id,
        category: row.category,
        photo: row.photo,
        percent_funded: row.percent_funded,
        backers_count: row.backers_count,
        staff_pick: row.staff_pick,
        spotlight: row.spotlight,
        urls: row.urls,
        creator: {
          id: row.creator_id,
          name: row.creator_name,
          slug: row.creator_slug,
          avatar: row.creator_avatar,
          urls: row.creator_urls,
          is_superbacker: row.creator_is_superbacker,
          websites: row.creator_websites
        },
        creator_outreach: row.outreach_status ? {
          creator_id: row.creator_id,
          outreach_status: row.outreach_status,
          created_at: '',
          updated_at: ''
        } : null
      }))

      // Replace projects on filter change, append on pagination
      if (replaceProjects || isNewFilter) {
        setProjects(projectsData)
      } else {
        setProjects(prev => [...prev, ...projectsData])
      }

      setHasMore(projectsData.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    loadProjects(nextPage, false)
  }, [page, filters])

  const handleStatusChange = (projectId: number, creatorId: number, newStatus: string) => {
    // Update local state only - don't reload from server
    setProjects(prevProjects =>
      prevProjects.map(project => {
        // Update all projects from the same creator
        if (project.creator_id === creatorId) {
          return {
            ...project,
            creator_outreach: project.creator_outreach ? {
              ...project.creator_outreach,
              outreach_status: newStatus as any,
              updated_at: new Date().toISOString()
            } : null
          }
        }
        return project
      })
    )
  }

  const handleExport = async () => {
    setExportDialogOpen(true)
    setExportStatus('confirming')
  }

  const performExport = async () => {
    setExportStatus('exporting')
    setExporting(true)

    try {
      // Fetch ALL projects with current filters (no pagination)
      const params = new URLSearchParams({
        limit: '999999', // Get all results
        offset: '0'
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.state) params.append('state', filters.state)
      if (filters.country) params.append('country', filters.country)
      if (filters.category) params.append('category', filters.category)
      if (filters.minGoal !== null) params.append('minGoal', filters.minGoal.toString())
      if (filters.maxGoal !== null) params.append('maxGoal', filters.maxGoal.toString())
      if (filters.minPercent !== null) params.append('minPercent', filters.minPercent.toString())
      if (filters.staffPick !== null) params.append('staffPick', filters.staffPick.toString())
      if (filters.outreachStatus) params.append('outreachStatus', filters.outreachStatus)
      if (filters.hasInstagram) params.append('hasInstagram', 'true')
      if (filters.hasFacebook) params.append('hasFacebook', 'true')
      if (filters.hasTwitter) params.append('hasTwitter', 'true')
      if (filters.hasYoutube) params.append('hasYoutube', 'true')
      if (filters.hasTiktok) params.append('hasTiktok', 'true')
      if (filters.hasLinkedin) params.append('hasLinkedin', 'true')
      if (filters.hasPatreon) params.append('hasPatreon', 'true')
      if (filters.hasDiscord) params.append('hasDiscord', 'true')
      if (filters.hasTwitch) params.append('hasTwitch', 'true')
      if (filters.hasBluesky) params.append('hasBluesky', 'true')
      if (filters.hasOtherWebsite) params.append('hasOtherWebsite', 'true')

      const response = await fetch(`/api/projects?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export projects')
      }

      const { data } = await response.json()

      // Define columns for export
      const columns = [
        { header: 'Project Name', key: 'name' },
        { header: 'Blurb', key: 'blurb' },
        { header: 'Creator', key: 'creator_name' },
        { header: 'Goal', key: 'goal', format: (v: number) => formatCurrencyForExcel(v, 'USD') },
        { header: 'Backers', key: 'backers_count' },
        { header: 'State', key: 'state' },
        { header: 'Category', key: 'category.name' },
        { header: 'Country', key: 'country_displayable_name' },
        { header: 'Created', key: 'created_at_ks', format: formatDateForExcel },
        { header: 'Deadline', key: 'deadline', format: formatDateForExcel },
        { header: 'Contact Status', key: 'outreach_status' },
        { header: 'Project URL', key: 'slug', format: (slug: string) => `https://www.kickstarter.com/projects/${slug}` },
        { header: 'Creator URL', key: 'creator_slug', format: (slug: string) => slug ? `https://www.kickstarter.com/profile/${slug}` : '' },
      ]

      const filename = `kickstarter_projects_${new Date().toISOString().split('T')[0]}.xlsx`
      exportToExcel(data, columns, filename, 'Projects')

      setExportedCount(data.length)
      setExportStatus('success')
    } catch (error) {
      console.error('Export failed:', error)
      setExportError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setExportStatus('error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportDialogClose = () => {
    setExportDialogOpen(false)
    setExportStatus('idle')
    setExportError('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="font-medium">Loading projects...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <aside className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <ProjectFiltersComponent
            filters={filters}
            onChange={setFilters}
            countries={countries}
            categories={categories}
          />
        </div>
      </aside>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">
              {loadingMore && projects.length > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  Loading more...
                </span>
              ) : (
                `${projects.length} of ${totalCount.toLocaleString()} projects`
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>

            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('table')}
            >
              <Table className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
        </div>

        {loadingMore && projects.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="font-medium">Loading projects...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No projects found</p>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <ProjectGrid projects={projects} onStatusChange={handleStatusChange} />
            ) : (
              <ProjectTable projects={projects} onStatusChange={handleStatusChange} />
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {loadingMore && projects.length > 0 && (
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Loading more projects...
                </div>
              )}
              {!hasMore && projects.length > 0 && (
                <p className="text-muted-foreground">No more projects to load</p>
              )}
            </div>
          </>
        )}
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={handleExportDialogClose}
        status={exportStatus}
        onConfirm={performExport}
        itemCount={exportedCount}
        itemType="projects"
        errorMessage={exportError}
      />
    </div>
  )
}
