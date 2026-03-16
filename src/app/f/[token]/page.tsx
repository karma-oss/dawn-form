'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FormField {
  type: 'text' | 'email' | 'select' | 'textarea' | 'number' | 'checkbox'
  label: string
  required: boolean
  options?: string[]
}

interface FormData {
  id: string
  title: string
  description: string | null
  fields: FormField[]
  is_active: boolean
}

export default function PublicFormPage() {
  const params = useParams()
  const token = params.token as string
  const [form, setForm] = useState<FormData | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadForm = useCallback(async () => {
    const res = await fetch(`/api/forms/public/${token}`)
    if (res.ok) {
      const data = await res.json()
      setForm(data)
      const initial: Record<string, string | boolean> = {}
      for (const field of data.fields) {
        initial[field.label] = field.type === 'checkbox' ? false : ''
      }
      setValues(initial)
    } else {
      setError('フォームが見つかりません')
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  function updateValue(label: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [label]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSubmitting(true)

    for (const field of form.fields) {
      if (field.required) {
        const v = values[field.label]
        if (v === '' || v === undefined || v === null) {
          setError(`「${field.label}」は必須です`)
          setSubmitting(false)
          return
        }
      }
    }

    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: form.id, responses: values }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      setError('送信に失敗しました')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" data-karma-context="form-submitted">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="mb-2 text-2xl font-bold text-green-600">送信完了</p>
            <p className="text-gray-500">回答を送信しました。ありがとうございます。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" data-karma-context="public-form" data-karma-auth="none">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">{form.title}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.fields.map((field, index) => (
              <div key={index} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>

                {field.type === 'text' && (
                  <Input
                    value={values[field.label] as string}
                    onChange={(e) => updateValue(field.label, e.target.value)}
                    required={field.required}
                    data-karma-test-id={`field-${index}`}
                  />
                )}

                {field.type === 'email' && (
                  <Input
                    type="email"
                    value={values[field.label] as string}
                    onChange={(e) => updateValue(field.label, e.target.value)}
                    required={field.required}
                    data-karma-test-id={`field-${index}`}
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    type="number"
                    value={values[field.label] as string}
                    onChange={(e) => updateValue(field.label, e.target.value)}
                    required={field.required}
                    data-karma-test-id={`field-${index}`}
                  />
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    value={values[field.label] as string}
                    onChange={(e) => updateValue(field.label, e.target.value)}
                    required={field.required}
                    data-karma-test-id={`field-${index}`}
                  />
                )}

                {field.type === 'select' && (
                  <Select
                    value={values[field.label] as string}
                    onValueChange={(v) => updateValue(field.label, v ?? '')}
                  >
                    <SelectTrigger data-karma-test-id={`field-${index}`}>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={values[field.label] as boolean}
                      onChange={(e) => updateValue(field.label, e.target.checked)}
                      data-karma-test-id={`field-${index}`}
                    />
                    <span className="text-sm">はい</span>
                  </label>
                )}
              </div>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting} data-karma-test-id="submit-form-btn">
              {submitting ? '送信中...' : '送信'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
