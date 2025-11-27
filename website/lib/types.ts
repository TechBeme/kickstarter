import { Database } from './database.types'

export type Creator = Database['public']['Tables']['creators']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type CreatorOutreach = Database['public']['Tables']['creator_outreach']['Row']

export type ProjectWithCreator = Project & {
    creator: Creator
    creator_outreach: CreatorOutreach | null
}

export type CreatorWithOutreach = Creator & {
    project_count?: number
    creator_outreach: CreatorOutreach | null
}

export type ProjectFilters = {
    search: string
    state: string
    country: string
    category: string
    minGoal?: number
    maxGoal?: number
    minFundedPercentage?: number
    staffPick: boolean
    hasInstagram: boolean
    hasFacebook: boolean
    hasTwitter: boolean
    hasYoutube: boolean
    hasTiktok: boolean
    hasLinkedin: boolean
    hasPatreon: boolean
    hasDiscord: boolean
    hasTwitch: boolean
    hasBluesky: boolean
    hasOtherWebsite: boolean
    outreachStatus: string
}

export type CreatorFilters = {
    search: string
    minBacked?: number
    hasWebsite: boolean
    hasInstagram: boolean
    hasFacebook: boolean
    hasTwitter: boolean
    hasYoutube: boolean
    hasTiktok: boolean
    hasLinkedin: boolean
    hasPatreon: boolean
    hasDiscord: boolean
    hasTwitch: boolean
    hasBluesky: boolean
    hasOtherWebsite: boolean
    outreachStatus: string
}

export const OUTREACH_STATUS = [
    'not_contacted',
    'email_sent',
    'follow_up_1',
    'follow_up_2',
    'responded',
    'interested',
    'not_interested',
    'no_response',
    'partnership',
] as const

export type OutreachStatus = typeof OUTREACH_STATUS[number]

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
    not_contacted: 'Not Contacted',
    email_sent: 'Email Sent',
    follow_up_1: 'Follow Up 1',
    follow_up_2: 'Follow Up 2',
    responded: 'Responded',
    interested: 'Interested',
    not_interested: 'Not Interested',
    no_response: 'No Response',
    partnership: 'Partnership',
}

export const OUTREACH_STATUS_COLORS: Record<OutreachStatus, string> = {
    not_contacted: 'bg-slate-100 text-slate-800 border border-slate-300',
    email_sent: 'bg-blue-100 text-blue-800 border border-blue-300',
    follow_up_1: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
    follow_up_2: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    responded: 'bg-lime-100 text-lime-800 border border-lime-300',
    interested: 'bg-green-100 text-green-800 border border-green-300',
    not_interested: 'bg-red-100 text-red-800 border border-red-300',
    no_response: 'bg-orange-100 text-orange-800 border border-orange-300',
    partnership: 'bg-amber-100 text-amber-800 border border-amber-300',
}

export const PROJECT_STATES = [
    'live',
    'successful',
    'failed',
    'canceled',
    'suspended',
    'started',
] as const

export type ProjectState = typeof PROJECT_STATES[number]
