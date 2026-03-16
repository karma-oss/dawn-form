import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const { data, error } = await supabase
    .from('form_responses')
    .select('*, forms!inner(title, organization_id)')
    .eq('forms.organization_id', staff.organization_id)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  if (!body.form_id || !body.responses) {
    return NextResponse.json({ error: 'Missing form_id or responses' }, { status: 400 })
  }

  // Verify form exists and is active
  const { data: form } = await supabase
    .from('forms')
    .select('id, is_active')
    .eq('id', body.form_id)
    .eq('is_active', true)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })
  }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null

  const { data, error } = await supabase
    .from('form_responses')
    .insert({
      form_id: body.form_id,
      contact_id: body.contact_id || null,
      responses: body.responses,
      ip_address: ip,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
