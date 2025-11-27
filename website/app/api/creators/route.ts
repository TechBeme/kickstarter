import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        const search = searchParams.get('search') || null
        const minBacked = searchParams.get('minBacked') ? parseInt(searchParams.get('minBacked')!) : null
        const outreachStatus = searchParams.get('outreachStatus') || null

        const { data, error } = await (supabaseServer as any).rpc('search_creators', {
            p_search: search,
            p_min_backed: minBacked,
            p_outreach_status: outreachStatus,
            p_has_instagram: searchParams.get('hasInstagram') === 'true',
            p_has_facebook: searchParams.get('hasFacebook') === 'true',
            p_has_twitter: searchParams.get('hasTwitter') === 'true',
            p_has_youtube: searchParams.get('hasYoutube') === 'true',
            p_has_tiktok: searchParams.get('hasTiktok') === 'true',
            p_has_linkedin: searchParams.get('hasLinkedin') === 'true',
            p_has_patreon: searchParams.get('hasPatreon') === 'true',
            p_has_discord: searchParams.get('hasDiscord') === 'true',
            p_has_twitch: searchParams.get('hasTwitch') === 'true',
            p_has_bluesky: searchParams.get('hasBluesky') === 'true',
            p_has_other_website: searchParams.get('hasOtherWebsite') === 'true',
            p_has_website: searchParams.get('hasWebsite') === 'true',
            p_limit: limit,
            p_offset: offset
        })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Extract total_count from first row
        const total_count = data && data.length > 0 ? data[0].total_count : 0

        return NextResponse.json({
            data: data || [],
            total_count: total_count
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
