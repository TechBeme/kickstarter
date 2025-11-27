import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const creatorId = parseInt(id)

        if (isNaN(creatorId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        // Get creator data
        const { data: creatorData, error: creatorError } = await supabaseServer
            .from('creators')
            .select('*')
            .eq('id', creatorId)
            .single()

        if (creatorError) {
            console.error('Creator error:', creatorError)
            return NextResponse.json({ error: creatorError.message }, { status: 500 })
        }

        // Get outreach status
        const { data: outreachData } = await (supabaseServer as any)
            .from('creator_outreach')
            .select('*')
            .eq('creator_id', creatorId)
            .maybeSingle()

        // Get creator's projects
        const { data: projectsData } = await supabaseServer
            .from('projects')
            .select('*')
            .eq('creator_id', creatorId)
            .order('launched_at', { ascending: false })

        return NextResponse.json({
            creator: creatorData,
            outreach: outreachData,
            projects: projectsData || []
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
