'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { CreatorWithOutreach, CreatorFilters } from '@/lib/types'
import { CreatorGrid } from '@/components/creators/creator-grid'
import { CreatorTable } from '@/components/creators/creator-table'
import { CreatorFiltersComponent } from '@/components/creators/creator-filters'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Table, Download, Loader2 } from 'lucide-react'
import { exportToExcel } from '@/lib/utils/excel-export'
import { ExportDialog } from '@/components/ui/export-dialog'

const PAGE_SIZE = 50

export default function CreatorsPage() {
  const [creators, setCreators] = useState<CreatorWithOutreach[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'confirming' | 'exporting' | 'success' | 'error'>('idle')
  const [exportedCount, setExportedCount] = useState(0)
  const [exportError, setExportError] = useState('')
  const observerTarget = useRef<HTMLDivElement>(null)
  const initialLoadDone = useRef(false)

  const [filters, setFilters] = useState<CreatorFilters>({
    search: '',
    minBacked: undefined,
    hasWebsite: false,
    hasInstagram: false,
    hasFacebook: false,
    hasTwitter: false,
    hasYoutube: false,
    hasTiktok: false,
    hasLinkedin: false,
    hasPatreon: false,
    hasDiscord: false,
    hasTwitch: false,
    hasBluesky: false,
    hasOtherWebsite: false,
    outreachStatus: ''
  })

  useEffect(() => {
    loadCreators(0, true)
      .then(() => {
        initialLoadDone.current = true
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (initialLoadDone.current) {
      setCreators([]) // Clear creators to show spinner
      setPage(0)
      setHasMore(true)
      loadCreators(0, true, true) // Pass true to replace current creators
    }
  }, [filters])

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

  async function loadCreators(pageNum: number, isNewFilter = false, replaceCreators = false) {
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
      if (filters.minBacked) params.append('minBacked', filters.minBacked.toString())
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
      if (filters.hasWebsite) params.append('hasWebsite', 'true')

      const response = await fetch(`/api/creators?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load creators')
      }

      const { data, total_count } = await response.json()

      if (!data || data.length === 0) {
        setHasMore(false)
        setTotalCount(0)
        if (isNewFilter) {
          setCreators([])
        }
        return
      }

      // Get total count from first row (all rows have the same total_count)
      setTotalCount(data[0].total_count || 0)

      // Transform RPC response to CreatorWithOutreach format
      const creatorsData: CreatorWithOutreach[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        avatar: row.avatar,
        urls: row.urls,
        is_superbacker: row.is_superbacker,
        websites: row.websites,
        backing_action_count: row.backed_action_count,
        project_count: row.project_count,
        creator_outreach: row.outreach_status ? {
          creator_id: row.id,
          outreach_status: row.outreach_status,
          created_at: '',
          updated_at: ''
        } : null
      }))

      // Replace creators on filter change, append on pagination
      if (replaceCreators || isNewFilter) {
        setCreators(creatorsData)
      } else {
        setCreators(prev => [...prev, ...creatorsData])
      }

      setHasMore(creatorsData.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error loading creators:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    loadCreators(nextPage, false)
  }, [page, filters])

  const handleStatusChange = (creatorId: number, newStatus: string) => {
    // Update local state only - don't reload from server
    setCreators(prevCreators =>
      prevCreators.map(creator => {
        if (creator.id === creatorId) {
          // If no outreach record exists, create a minimal one
          const existingOutreach = creator.creator_outreach

          return {
            ...creator,
            creator_outreach: existingOutreach ? {
              ...existingOutreach,
              outreach_status: newStatus as any,
              updated_at: new Date().toISOString()
            } : {
              creator_id: creatorId,
              outreach_status: newStatus as any,
              has_instagram: false,
              has_facebook: false,
              has_twitter: false,
              has_youtube: false,
              has_tiktok: false,
              has_linkedin: false,
              has_patreon: false,
              has_discord: false,
              has_twitch: false,
              has_bluesky: false,
              has_other_website: false,
              has_any_contact: false,
              last_contacted_at: null,
              first_contacted_at: null,
              response_received_at: null,
              notes: null,
              tags: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        }
        return creator
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
      // Fetch ALL creators with current filters (no pagination)
      const params = new URLSearchParams({
        limit: '999999', // Get all results
        offset: '0'
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.minBacked) params.append('minBacked', filters.minBacked.toString())
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
      if (filters.hasWebsite) params.append('hasWebsite', 'true')

      const response = await fetch(`/api/creators?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export creators')
      }

      const { data } = await response.json()

      // Extract social media URLs
      const extractSocialUrls = (websites: any[], type: string) => {
        if (!websites) return ''
        const urls = websites
          .filter((w: any) => {
            const domain = w.domain?.toLowerCase() || ''
            return domain.includes(type)
          })
          .map((w: any) => w.url)
        return urls.join(', ')
      }

      const extractOtherWebsites = (websites: any[]) => {
        if (!websites) return ''
        const socialDomains = ['instagram', 'facebook', 'twitter', 'x.com', 'youtube', 'tiktok', 'linkedin', 'patreon', 'discord', 'twitch', 'bsky.app']
        const others = websites.filter((w: any) => {
          const domain = w.domain?.toLowerCase() || ''
          return !socialDomains.some(s => domain.includes(s))
        })
        return others.map((w: any) => w.url).join(', ')
      }

      // Define columns for export
      const columns = [
        { header: 'Creator Name', key: 'name' },
        {
          header: 'Username',
          key: 'slug',
          format: (slug: string, row: any) => slug || row.id?.toString() || ''
        },
        { header: 'Projects', key: 'project_count' },
        { header: 'Backed', key: 'backed_action_count' },
        { header: 'Contact Status', key: 'outreach_status' },
        {
          header: 'Profile URL',
          key: 'slug',
          format: (slug: string, row: any) => {
            const identifier = slug || row.id
            return identifier ? `https://www.kickstarter.com/profile/${identifier}` : ''
          }
        },
        { header: 'Instagram', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'instagram') },
        { header: 'Facebook', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'facebook') },
        { header: 'Twitter', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'twitter') || extractSocialUrls(w, 'x.com') },
        { header: 'YouTube', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'youtube') },
        { header: 'TikTok', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'tiktok') },
        { header: 'LinkedIn', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'linkedin') },
        { header: 'Patreon', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'patreon') },
        { header: 'Discord', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'discord') },
        { header: 'Twitch', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'twitch') },
        { header: 'Bluesky', key: 'websites', format: (w: any[]) => extractSocialUrls(w, 'bsky.app') },
        { header: 'Other Websites', key: 'websites', format: extractOtherWebsites },
      ]

      const filename = `kickstarter_creators_${new Date().toISOString().split('T')[0]}.xlsx`
      exportToExcel(data, columns, filename, 'Creators')

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
            <p className="font-medium">Loading creators...</p>
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
          <CreatorFiltersComponent filters={filters} onChange={setFilters} />
        </div>
      </aside>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Creators</h1>
            <p className="text-muted-foreground mt-1">
              {loadingMore && creators.length > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  Loading more...
                </span>
              ) : (
                `${creators.length} of ${totalCount.toLocaleString()} creators`
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

        {loadingMore && creators.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="font-medium">Loading creators...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No creators found</p>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <CreatorGrid creators={creators} onUpdate={handleStatusChange} />
            ) : (
              <CreatorTable creators={creators} onUpdate={handleStatusChange} />
            )}

            <div ref={observerTarget} className="py-8 text-center">
              {loadingMore && creators.length > 0 && (
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Loading more creators...
                </div>
              )}
              {!hasMore && creators.length > 0 && (
                <p className="text-muted-foreground">No more creators to load</p>
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
        itemType="creators"
        errorMessage={exportError}
      />
    </div>
  )
}
