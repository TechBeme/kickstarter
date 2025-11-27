import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const projectId = parseInt(id)

        if (isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        // Get project data
        const { data: projectData, error: projectError } = await supabaseServer
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (projectError) {
            console.error('Project error:', projectError)
            return NextResponse.json({ error: projectError.message }, { status: 500 })
        }

        const project = projectData as any

        // Get creator data
        const { data: creatorData } = await supabaseServer
            .from('creators')
            .select('*')
            .eq('id', project.creator_id)
            .single()

        // Get outreach status
        const { data: outreachData } = await (supabaseServer as any)
            .from('creator_outreach')
            .select('*')
            .eq('creator_id', project.creator_id)
            .maybeSingle()

        return NextResponse.json({
            project: projectData,
            creator: creatorData,
            outreach: outreachData
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
