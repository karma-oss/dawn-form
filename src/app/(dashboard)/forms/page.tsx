'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface FormField {
  type: 'text' | 'email' | 'select' | 'textarea' | 'number' | 'checkbox'
  label: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  title: string
  description: string | null
  fields: FormField[]
  is_active: boolean
  public_token: string
  created_at: string
}

const fieldTypeLabels: Record<string, string> = {
  text: 'テキスト',
  email: 'メール',
  select: 'セレクト',
  textarea: 'テキストエリア',
  number: '数値',
  checkbox: 'チェックボックス',
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const supabase = createClient()

  const loadForms = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staff } = await supabase
      .from('staff')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    if (!staff) return

    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('organization_id', staff.organization_id)
      .order('created_at', { ascending: false })

    setForms((data as Form[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadForms()
  }, [loadForms])

  function resetForm() {
    setTitle('')
    setDescription('')
    setFields([])
    setEditingForm(null)
  }

  function openCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(form: Form) {
    setEditingForm(form)
    setTitle(form.title)
    setDescription(form.description || '')
    setFields(form.fields)
    setDialogOpen(true)
  }

  function addField() {
    setFields([...fields, { type: 'text', label: '', required: false }])
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
  }

  function updateField(index: number, updates: Partial<FormField>) {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }
    if (fields.length === 0) {
      toast.error('フィールドを1つ以上追加してください')
      return
    }
    for (const f of fields) {
      if (!f.label.trim()) {
        toast.error('すべてのフィールドにラベルを入力してください')
        return
      }
    }

    if (editingForm) {
      const res = await fetch(`/api/forms/${editingForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, fields }),
      })
      if (res.ok) {
        toast.success('フォームを更新しました')
        setDialogOpen(false)
        loadForms()
      } else {
        toast.error('更新に失敗しました')
      }
    } else {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, fields }),
      })
      if (res.ok) {
        toast.success('フォームを作成しました')
        setDialogOpen(false)
        loadForms()
      } else {
        toast.error('作成に失敗しました')
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('本当に削除しますか？')) return
    const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('フォームを削除しました')
      loadForms()
    } else {
      toast.error('削除に失敗しました')
    }
  }

  function copyPublicUrl(token: string) {
    const url = `${window.location.origin}/f/${token}`
    navigator.clipboard.writeText(url)
    toast.success('公開URLをコピーしました')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-gray-500">読み込み中...</p></div>
  }

  return (
    <div data-karma-context="forms-management" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">フォーム管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button data-karma-test-id="create-form-btn" />} onClick={openCreate}>新規フォーム</DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingForm ? 'フォーム編集' : '新規フォーム作成'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title">タイトル</Label>
                <Input id="form-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="お問い合わせフォーム" data-karma-test-id="form-title-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-desc">説明</Label>
                <Textarea id="form-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="フォームの説明（任意）" />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>フィールド</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addField} data-karma-test-id="add-field-btn">フィールド追加</Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="ラベル"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                          />
                        </div>
                        <Select value={field.type} onValueChange={(v) => updateField(index, { type: (v ?? 'text') as FormField['type'] })}>
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(fieldTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                          />
                          必須
                        </label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700">削除</Button>
                      </div>
                      {field.type === 'select' && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">選択肢（カンマ区切り）</Label>
                          <Input
                            placeholder="選択肢1, 選択肢2, 選択肢3"
                            value={(field.options || []).join(', ')}
                            onChange={(e) => updateField(index, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {fields.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-400">フィールドを追加してください</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
                <Button onClick={handleSave} data-karma-test-id="save-form-btn">{editingForm ? '更新' : '作成'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">フォームがありません。新規フォームを作成してください。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <Card key={form.id} data-karma-entity="form">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{form.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.is_active ? 'default' : 'secondary'}>
                      {form.is_active ? '公開中' : '非公開'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {form.description && <p className="mb-2 text-sm text-gray-500">{form.description}</p>}
                <p className="mb-3 text-xs text-gray-400">{form.fields.length} フィールド ・ 作成日: {new Date(form.created_at).toLocaleDateString('ja-JP')}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyPublicUrl(form.public_token)}>公開URLをコピー</Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(form)}>編集</Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(form.id)}>削除</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
