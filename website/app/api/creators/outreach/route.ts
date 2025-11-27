import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { creatorId, outreachStatus, status } = body
        const newStatus = outreachStatus || status

        if (!creatorId || !newStatus) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if record exists
        const { data: existing } = await (supabaseServer as any)
            .from('creator_outreach')
            .select('creator_id')
            .eq('creator_id', creatorId)
            .maybeSingle()

        if (existing) {
            // Update existing record
            const { error } = await (supabaseServer as any)
                .from('creator_outreach')
                .update({
                    outreach_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('creator_id', creatorId)

            if (error) throw error
        } else {
            // Insert new record
            const { error } = await (supabaseServer as any)
                .from('creator_outreach')
                .insert({
                    creator_id: creatorId,
                    outreach_status: newStatus
                })

            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
