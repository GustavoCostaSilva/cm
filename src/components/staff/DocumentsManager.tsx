'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Loader2, Trash2, Download, Eye, EyeOff } from 'lucide-react'
import { DOC_CATEGORIES, type CaseDocument } from '@/types'
import { formatDate } from '@/lib/case-utils'

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

const FIELD =
  'rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

export function DocumentsManager({
  clientId,
  documents,
}: {
  clientId: string
  documents: CaseDocument[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [category, setCategory] = useState('')
  const [visible, setVisible] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Selecione um arquivo.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    if (category) fd.append('category', category)
    fd.append('visibleToClient', String(visible))
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/documents`, {
        method: 'POST',
        body: fd,
      })
      if (res.ok) {
        toast.success('Documento enviado.')
        if (fileRef.current) fileRef.current.value = ''
        setCategory('')
        setVisible(false)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erro no upload.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleVisible(doc: CaseDocument) {
    const res = await fetch(`/api/staff/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibleToClient: !doc.visibleToClient }),
    })
    if (res.ok) router.refresh()
    else toast.error('Erro ao atualizar.')
  }

  async function remove(doc: CaseDocument) {
    if (!confirm(`Excluir "${doc.originalName}"?`)) return
    const res = await fetch(`/api/staff/documents/${doc.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Documento removido.')
      router.refresh()
    } else toast.error('Erro ao remover.')
  }

  return (
    <div>
      <form onSubmit={upload} className="flex flex-wrap items-end gap-2">
        <input ref={fileRef} type="file" className="max-w-[200px] text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
          <option value="">Categoria…</option>
          {DOC_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-foreground">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="size-3.5 accent-[#1b3a6b]" />
          Visível ao cliente
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Enviar
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {documents.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum documento enviado.</li>
        )}
        {documents.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <div className="min-w-0 flex-1">
              <a
                href={`/api/documents/${d.id}`}
                className="block truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {d.originalName}
              </a>
              <div className="text-xs text-muted-foreground">
                {[d.category, fmtSize(d.sizeBytes), formatDate(d.uploadedAt)].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button
              onClick={() => toggleVisible(d)}
              title={d.visibleToClient ? 'Visível ao cliente' : 'Oculto do cliente'}
              className={d.visibleToClient ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
            >
              {d.visibleToClient ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
            <a href={`/api/documents/${d.id}`} className="text-muted-foreground hover:text-foreground" title="Baixar">
              <Download className="size-4" />
            </a>
            <button onClick={() => remove(d)} className="text-muted-foreground hover:text-destructive" title="Excluir">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
