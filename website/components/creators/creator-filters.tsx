'use client'

import { CreatorFilters } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Filter, Search, Instagram, Facebook, Youtube, Linkedin, Twitch } from 'lucide-react'
import { useState } from 'react'
import { OUTREACH_STATUS_LABELS } from '@/lib/types'

interface CreatorFiltersProps {
    filters: CreatorFilters
    onChange: (filters: CreatorFilters) => void
}

export function CreatorFiltersComponent({ filters, onChange }: CreatorFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [localFilters, setLocalFilters] = useState<CreatorFilters>(filters)

    function updateLocalFilter(key: keyof CreatorFilters, value: any) {
        setLocalFilters({ ...localFilters, [key]: value })
    }

    function applyFilters() {
        onChange(localFilters)
    }

    function clearFilters() {
        const emptyFilters: CreatorFilters = {
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
        }
        setLocalFilters(emptyFilters)
        onChange(emptyFilters)
    }

    const activeFiltersCount = Object.values(localFilters).filter(v =>
        v !== null && v !== '' && v !== false && v !== undefined
    ).length

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        {activeFiltersCount > 0 && (
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Search */}
                <div>
                    <Label>Search</Label>
                    <Input
                        placeholder="Search creators..."
                        value={localFilters.search}
                        onChange={(e) => updateLocalFilter('search', e.target.value)}
                    />
                </div>

                {isExpanded && (
                    <>
                        {/* Minimum Backed Projects */}
                        <div className="space-y-2">
                            <Label>Min. Backed Projects</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 10"
                                className="w-full"
                                value={localFilters.minBacked || ''}
                                onChange={(e) => updateLocalFilter('minBacked', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>

                        {/* Contact Status */}
                        <div className="space-y-2">
                            <Label>Contact Status</Label>
                            <Select
                                value={localFilters.outreachStatus || 'all'}
                                onValueChange={(v) => updateLocalFilter('outreachStatus', v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Social Media Filters */}
                        <div className="space-y-3">
                            <div className="border-t pt-3">
                                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Social Media</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasInstagram"
                                        checked={localFilters.hasInstagram === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasInstagram', checked ? true : false)}
                                    />
                                    <label htmlFor="hasInstagram" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <Instagram className="h-4 w-4 text-pink-600" />
                                        Instagram
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasFacebook"
                                        checked={localFilters.hasFacebook === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasFacebook', checked ? true : false)}
                                    />
                                    <label htmlFor="hasFacebook" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <Facebook className="h-4 w-4 text-blue-600" />
                                        Facebook
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasTwitter"
                                        checked={localFilters.hasTwitter === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasTwitter', checked ? true : false)}
                                    />
                                    <label htmlFor="hasTwitter" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        X (Twitter)
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasYoutube"
                                        checked={localFilters.hasYoutube === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasYoutube', checked ? true : false)}
                                    />
                                    <label htmlFor="hasYoutube" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <Youtube className="h-4 w-4 text-red-600" />
                                        YouTube
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasTiktok"
                                        checked={localFilters.hasTiktok === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasTiktok', checked ? true : false)}
                                    />
                                    <label htmlFor="hasTiktok" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                        TikTok
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasLinkedin"
                                        checked={localFilters.hasLinkedin === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasLinkedin', checked ? true : false)}
                                    />
                                    <label htmlFor="hasLinkedin" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <Linkedin className="h-4 w-4 text-blue-700" />
                                        LinkedIn
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasPatreon"
                                        checked={localFilters.hasPatreon === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasPatreon', checked ? true : false)}
                                    />
                                    <label htmlFor="hasPatreon" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <svg className="h-4 w-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
                                        </svg>
                                        Patreon
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasDiscord"
                                        checked={localFilters.hasDiscord === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasDiscord', checked ? true : false)}
                                    />
                                    <label htmlFor="hasDiscord" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                        </svg>
                                        Discord
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasTwitch"
                                        checked={localFilters.hasTwitch === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasTwitch', checked ? true : false)}
                                    />
                                    <label htmlFor="hasTwitch" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <Twitch className="h-4 w-4 text-purple-600" />
                                        Twitch
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasBluesky"
                                        checked={localFilters.hasBluesky === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasBluesky', checked ? true : false)}
                                    />
                                    <label htmlFor="hasBluesky" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <svg className="h-4 w-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
                                        </svg>
                                        Bluesky
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasOtherWebsite"
                                        checked={localFilters.hasOtherWebsite === true}
                                        onCheckedChange={(checked) => updateLocalFilter('hasOtherWebsite', checked ? true : false)}
                                    />
                                    <label htmlFor="hasOtherWebsite" className="text-sm cursor-pointer flex items-center gap-1.5">
                                        <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="2" y1="12" x2="22" y2="12" />
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                        Others
                                    </label>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Apply Filters Button - Always at the bottom */}
                <Button
                    onClick={applyFilters}
                    className="w-full"
                    size="lg"
                >
                    <Search className="h-4 w-4 mr-2" />
                    Apply Filters
                </Button>
            </CardContent>
        </Card>
    )
}
