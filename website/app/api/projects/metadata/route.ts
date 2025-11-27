import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
    try {
        const { data, error } = await (supabaseServer as any).rpc('get_projects_metadata')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // The function returns a TABLE, so data is an array with one row
        const metadata = data?.[0] || { countries: [], categories: [] }

        return NextResponse.json(metadata)
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
