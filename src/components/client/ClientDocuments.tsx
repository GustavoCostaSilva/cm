import { Download, FileText } from 'lucide-react'
import type { CaseDocument } from '@/types'
import { formatDate } from '@/lib/case-utils'

export function ClientDocuments({
  documents,
  emptyText,
}: {
  documents: CaseDocument[]
  emptyText?: string
}) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyText ??
          'Nenhum documento disponível ainda. Quando o escritório compartilhar algo, aparecerá aqui.'}
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {documents.map((d) => (
        <li key={d.id}>
          <a
            href={`/api/documents/${d.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-secondary"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {d.originalName}
              </span>
              <span className="block text-xs text-muted-foreground">
                {[d.category, formatDate(d.uploadedAt)].filter(Boolean).join(' · ')}
              </span>
            </span>
            <Download className="size-4 shrink-0 text-muted-foreground" />
          </a>
        </li>
      ))}
    </ul>
  )
}
