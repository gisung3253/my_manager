import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user_id from request header (sent from frontend)
    const userIdHeader = request.headers.get('x-user-id')
    
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    const user_id = parseInt(userIdHeader)

    const { data: connectedAccounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    return NextResponse.json({ accounts: connectedAccounts || [] })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}