export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            creators: {
                Row: {
                    id: number
                    slug: string | null
                    name: string
                    is_registered: boolean | null
                    is_email_verified: boolean | null
                    chosen_currency: string | null
                    is_superbacker: boolean | null
                    has_admin_message_badge: boolean
                    ppo_has_action: boolean
                    backing_action_count: number
                    avatar: Json | null
                    urls: Json | null
                    websites: Json | null
                    data_hash: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: number
                    slug?: string | null
                    name: string
                    is_registered?: boolean | null
                    is_email_verified?: boolean | null
                    chosen_currency?: string | null
                    is_superbacker?: boolean | null
                    has_admin_message_badge?: boolean
                    ppo_has_action?: boolean
                    backing_action_count?: number
                    avatar?: Json | null
                    urls?: Json | null
                    websites?: Json | null
                    data_hash?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    slug?: string | null
                    name?: string
                    is_registered?: boolean | null
                    is_email_verified?: boolean | null
                    chosen_currency?: string | null
                    is_superbacker?: boolean | null
                    has_admin_message_badge?: boolean
                    ppo_has_action?: boolean
                    backing_action_count?: number
                    avatar?: Json | null
                    urls?: Json | null
                    websites?: Json | null
                    data_hash?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: number
                    slug: string
                    name: string
                    blurb: string | null
                    goal: number
                    pledged: number
                    percent_funded: number
                    backers_count: number
                    currency: string
                    currency_symbol: string | null
                    country: string
                    country_displayable_name: string | null
                    location: Json | null
                    state: string
                    state_changed_at: number | null
                    created_at_ks: number
                    launched_at: number | null
                    deadline: number | null
                    staff_pick: boolean
                    spotlight: boolean
                    creator_id: number
                    photo: Json | null
                    category: Json | null
                    video: Json | null
                    profile: Json | null
                    urls: Json | null
                    data_hash: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: number
                    slug: string
                    name: string
                    blurb?: string | null
                    goal: number
                    pledged?: number
                    percent_funded?: number
                    backers_count?: number
                    currency: string
                    currency_symbol?: string | null
                    country: string
                    country_displayable_name?: string | null
                    location?: Json | null
                    state: string
                    state_changed_at?: number | null
                    created_at_ks: number
                    launched_at?: number | null
                    deadline?: number | null
                    staff_pick?: boolean
                    spotlight?: boolean
                    creator_id: number
                    photo?: Json | null
                    category?: Json | null
                    video?: Json | null
                    profile?: Json | null
                    urls?: Json | null
                    data_hash?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    slug?: string
                    name?: string
                    blurb?: string | null
                    goal?: number
                    pledged?: number
                    percent_funded?: number
                    backers_count?: number
                    currency?: string
                    currency_symbol?: string | null
                    country?: string
                    country_displayable_name?: string | null
                    location?: Json | null
                    state?: string
                    state_changed_at?: number | null
                    created_at_ks?: number
                    launched_at?: number | null
                    deadline?: number | null
                    staff_pick?: boolean
                    spotlight?: boolean
                    creator_id?: number
                    photo?: Json | null
                    category?: Json | null
                    video?: Json | null
                    profile?: Json | null
                    urls?: Json | null
                    data_hash?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            creator_outreach: {
                Row: {
                    creator_id: number
                    has_instagram: boolean
                    has_facebook: boolean
                    has_twitter: boolean
                    has_youtube: boolean
                    has_tiktok: boolean
                    has_linkedin: boolean
                    has_patreon: boolean
                    has_discord: boolean
                    has_twitch: boolean
                    has_bluesky: boolean
                    has_other_website: boolean
                    has_any_contact: boolean
                    outreach_status: string
                    first_contacted_at: string | null
                    last_contacted_at: string | null
                    response_received_at: string | null
                    notes: string | null
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    creator_id: number
                    has_instagram?: boolean
                    has_facebook?: boolean
                    has_twitter?: boolean
                    has_youtube?: boolean
                    has_tiktok?: boolean
                    has_linkedin?: boolean
                    has_patreon?: boolean
                    has_discord?: boolean
                    has_twitch?: boolean
                    has_bluesky?: boolean
                    has_other_website?: boolean
                    has_any_contact?: boolean
                    outreach_status?: string
                    first_contacted_at?: string | null
                    last_contacted_at?: string | null
                    response_received_at?: string | null
                    notes?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    creator_id?: number
                    has_instagram?: boolean
                    has_facebook?: boolean
                    has_twitter?: boolean
                    has_youtube?: boolean
                    has_tiktok?: boolean
                    has_linkedin?: boolean
                    has_patreon?: boolean
                    has_discord?: boolean
                    has_twitch?: boolean
                    has_bluesky?: boolean
                    has_other_website?: boolean
                    has_any_contact?: boolean
                    outreach_status?: string
                    first_contacted_at?: string | null
                    last_contacted_at?: string | null
                    response_received_at?: string | null
                    notes?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
