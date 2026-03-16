'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Form {
  id: string
  title: string
  fields: { type: string; label: string; required: boolean; options?: string[] }[]
}

interface FormResponse {
  id: string
  form_id: string
  contact_id: string | null
  responses: Record<string, string | boolean>
  ip_address: string | null
  submitted_at: string
  forms: { title: string } | null
}

export default function ResponsesPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staff } = await supabase
      .from('staff')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    if (!staff) return

    const { data: formsData } = await supabase
      .from('forms')
      .select('id, title, fields')
      .eq('organization_id', staff.organization_id)
      .order('created_at', { ascending: false })

    setForms((formsData as Form[]) || [])

    let query = supabase
      .from('form_responses')
      .select('*, forms!inner(title, organization_id)')
      .eq('forms.organization_id', staff.organization_id)
      .order('submitted_at', { ascending: false })

    if (selectedFormId !== 'all') {
      query = query.eq('form_id', selectedFormId)
    }

    const { data: responsesData } = await query
    setResponses((responsesData as unknown as FormResponse[]) || [])
    setLoading(false)
  }, [supabase, selectedFormId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedForm = forms.find((f) => f.id === selectedFormId)
  const fieldLabels = selectedForm ? selectedForm.fields.map((f) => f.label) : []

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-gray-500">読み込み中...</p></div>
  }

  return (
    <div data-karma-context="responses" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">回答一覧</h1>
        <div className="w-64">
          <Select value={selectedFormId} onValueChange={(v) => setSelectedFormId(v ?? 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="フォームを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのフォーム</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            回答 <Badge variant="secondary">{responses.length}件</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">回答がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>フォーム</TableHead>
                    {selectedFormId !== 'all' && fieldLabels.map((label) => (
                      <TableHead key={label}>{label}</TableHead>
                    ))}
                    {selectedFormId === 'all' && <TableHead>回答内容</TableHead>}
                    <TableHead>送信日時</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id} data-karma-entity="form-response">
                      <TableCell className="font-medium">{response.forms?.title || '-'}</TableCell>
                      {selectedFormId !== 'all' && fieldLabels.map((label) => (
                        <TableCell key={label}>
                          {typeof response.responses[label] === 'boolean'
                            ? (response.responses[label] ? 'はい' : 'いいえ')
                            : String(response.responses[label] || '-')}
                        </TableCell>
                      ))}
                      {selectedFormId === 'all' && (
                        <TableCell className="max-w-xs truncate text-sm text-gray-500">
                          {Object.entries(response.responses).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(response.submitted_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{response.ip_address || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
