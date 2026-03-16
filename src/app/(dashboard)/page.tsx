import { getStaffWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const staff = await getStaffWithOrg()
  const supabase = await createClient()
  const orgId = staff.organization_id

  const { data: forms } = await supabase
    .from('forms')
    .select('id')
    .eq('organization_id', orgId)

  const formCount = forms?.length ?? 0

  const { data: allResponses } = await supabase
    .from('form_responses')
    .select('id, submitted_at, form_id, forms!inner(organization_id)')
    .eq('forms.organization_id', orgId)

  const totalResponses = allResponses?.length ?? 0

  const today = new Date().toISOString().split('T')[0]
  const todayResponses = allResponses?.filter((r) => {
    const submitted = r.submitted_at ? r.submitted_at.split('T')[0] : ''
    return submitted === today
  }).length ?? 0

  const stats = [
    { title: 'フォーム数', value: formCount.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: '総回答数', value: totalResponses.toString(), color: 'text-green-600', bg: 'bg-green-50' },
    { title: '今日の回答', value: todayResponses.toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div data-karma-context="dashboard" data-karma-auth="required">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <p className="mb-4 text-sm text-gray-500">{staff.organizations?.name} - {staff.name}</p>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title} className={s.bg} data-karma-entity="form-stat">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
