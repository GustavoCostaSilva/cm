'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  FolderOpen,
  Folder,
  Search,
  FileText,
  FileImage,
  FileArchive,
  File as FileIcon,
  ExternalLink,
} from 'lucide-react'
import { DOC_CATEGORIES, type CaseDocument } from '@/types'
import { formatDate } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

const NO_FOLDER = '(Sem pasta)'

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function fileIcon(mime: string | null): typeof FileIcon {
  if (!mime) return FileIcon
  if (mime.startsWith('image/')) return FileImage
  if (mime === 'application/pdf') return FileText
  if (mime.includes('zip') || mime.includes('compressed') || mime.includes('rar')) return FileArchive
  return FileIcon
}

function isPreviewable(mime: string | null): boolean {
  if (!mime) return false
  return mime === 'application/pdf' || mime.startsWith('image/')
}

export function DocumentsManager({
  clientId,
  documents,
}: {
  clientId: string
  documents: CaseDocument[]
}) {
  const router = useRouter()
  const [folder, setFolder] = useState<string | null>(null) // null = todos
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'date' | 'name' | 'size'>('date')
  const [visibleOnUpload, setVisibleOnUpload] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Folder list: every predefined category + "(Sem pasta)" if used.
  const folders = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of documents) {
      const k = d.category || NO_FOLDER
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    const list = DOC_CATEGORIES.map((c) => ({ key: c as string, count: counts.get(c) ?? 0 }))
    if (counts.has(NO_FOLDER)) list.push({ key: NO_FOLDER, count: counts.get(NO_FOLDER)! })
    return list
  }, [documents])

  const filtered = useMemo(() => {
    let xs = documents
    if (folder !== null) xs = xs.filter((d) => (d.category || NO_FOLDER) === folder)
    if (search.trim()) {
      const q = search.toLowerCase()
      xs = xs.filter(
        (d) =>
          d.originalName.toLowerCase().includes(q) ||
          (d.category ?? '').toLowerCase().includes(q),
      )
    }
    const sorted = [...xs]
    if (sort === 'name') sorted.sort((a, b) => a.originalName.localeCompare(b.originalName))
    else if (sort === 'size') sorted.sort((a, b) => b.sizeBytes - a.sizeBytes)
    else sorted.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    return sorted
  }, [documents, folder, search, sort])

  const stats = useMemo(() => {
    const total = documents.reduce((s, d) => s + d.sizeBytes, 0)
    return { count: documents.length, total }
  }, [documents])

  async function uploadFiles(files: FileList | File[] | null) {
    if (!files) return
    const arr = Array.from(files as ArrayLike<File>)
    if (arr.length === 0) return
    const fd = new FormData()
    arr.forEach((f) => fd.append('file', f))
    // Upload into currently selected folder (unless "Todos" or "(Sem pasta)").
    if (folder && folder !== NO_FOLDER) fd.append('category', folder)
    if (visibleOnUpload) fd.append('visibleToClient', 'true')
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/documents`, {
        method: 'POST',
        body: fd,
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`${d.count ?? arr.length} arquivo(s) enviado(s).`)
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      } else {
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

  async function moveTo(doc: CaseDocument, cat: string) {
    const next = cat === '' ? null : cat
    if (next === (doc.category ?? null)) return
    const res = await fetch(`/api/staff/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: next }),
    })
    if (res.ok) {
      toast.success('Movido.')
      router.refresh()
    } else toast.error('Erro ao mover.')
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
    <div className="grid gap-4 md:grid-cols-[210px_1fr]">
      {/* sidebar — pastas */}
      <aside className="space-y-0.5">
        <button
          onClick={() => setFolder(null)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
            folder === null
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground hover:bg-secondary',
          )}
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="size-4" /> Todos
          </span>
          <span className="text-xs text-muted-foreground">{documents.length}</span>
        </button>
        {folders.map((f) => (
          <button
            key={f.key}
            onClick={() => setFolder(f.key)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
              folder === f.key
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground hover:bg-secondary',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Folder className="size-4 shrink-0" />
              <span className="truncate">{f.key}</span>
            </span>
            <span className="text-xs text-muted-foreground">{f.count}</span>
          </button>
        ))}
        <div className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
          {stats.count} arquivo{stats.count === 1 ? '' : 's'} · {fmtSize(stats.total)}
          <br />
          Limite por arquivo: 20 MB
        </div>
      </aside>

      {/* painel principal */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragOver) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          uploadFiles(e.dataTransfer.files)
        }}
        className={cn(
          'relative overflow-hidden rounded-xl border bg-background transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou pasta…"
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            title="Ordenar"
          >
            <option value="date">Mais recentes</option>
            <option value="name">Nome (A→Z)</option>
            <option value="size">Maiores</option>
          </select>
          <label className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground">
            <input
              type="checkbox"
              checked={visibleOnUpload}
              onChange={(e) => setVisibleOnUpload(e.target.checked)}
              className="size-3.5 accent-[#1b3a6b]"
            />
            Visível ao cliente
          </label>
          <label
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Enviar arquivos
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
              disabled={busy}
            />
          </label>
        </div>

        {/* breadcrumb / contexto */}
        <div className="border-b border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground">
          {folder === null ? (
            <>Todos os arquivos do cliente</>
          ) : (
            <>
              Pasta: <span className="font-medium text-foreground">{folder}</span>
              {folder !== NO_FOLDER && (
                <span className="ml-2 text-[11px]">(novos arquivos vão para esta pasta)</span>
              )}
            </>
          )}
        </div>

        {/* lista de arquivos */}
        {filtered.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted-foreground">
            {dragOver
              ? 'Solte para enviar.'
              : search
                ? 'Nenhum arquivo encontrado para essa busca.'
                : documents.length === 0
                  ? 'Sem arquivos ainda. Arraste arquivos aqui ou clique em "Enviar arquivos".'
                  : 'Esta pasta está vazia.'}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((d) => {
              const Icon = fileIcon(d.mime)
              const previewable = isPreviewable(d.mime)
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 sm:flex-nowrap"
                >
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/documents/${d.id}${previewable ? '?inline=1' : ''}`}
                      target="_blank"
                      rel="noopener"
                      className="block truncate text-sm font-medium text-foreground hover:text-primary"
                      title={previewable ? 'Abrir prévia em nova aba' : 'Baixar'}
                    >
                      {d.originalName}
                    </a>
                    <div className="truncate text-xs text-muted-foreground">
                      {[
                        d.category || NO_FOLDER,
                        fmtSize(d.sizeBytes),
                        `por ${d.uploadedBy}`,
                        formatDate(d.uploadedAt),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <select
                      value={d.category ?? ''}
                      onChange={(e) => moveTo(d, e.target.value)}
                      title="Mover para pasta"
                      className="hidden max-w-[150px] rounded-md border border-input bg-background px-1.5 py-1 text-xs md:block"
                    >
                      <option value="">(Sem pasta)</option>
                      {DOC_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {previewable && (
                      <a
                        href={`/api/documents/${d.id}?inline=1`}
                        target="_blank"
                        rel="noopener"
                        title="Abrir em nova aba"
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <button
                      onClick={() => toggleVisible(d)}
                      title={
                        d.visibleToClient ? 'Visível ao cliente (clique para ocultar)' : 'Oculto do cliente (clique para liberar)'
                      }
                      className={cn(
                        'rounded p-1 hover:bg-secondary',
                        d.visibleToClient ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {d.visibleToClient ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <a
                      href={`/api/documents/${d.id}`}
                      title="Baixar"
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Download className="size-4" />
                    </a>
                    <button
                      onClick={() => remove(d)}
                      title="Excluir"
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {dragOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/5">
            <div className="rounded-lg border-2 border-dashed border-primary bg-card px-5 py-3 text-sm font-medium text-primary shadow-sm">
              Solte para enviar para {folder && folder !== NO_FOLDER ? `"${folder}"` : 'o cliente'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
