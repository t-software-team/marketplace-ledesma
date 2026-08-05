'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { FileText, ShieldCheck, UploadCloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { uploadVerificationDocument } from '@/lib/shops/upload-image'
import { updateVerificationDocument } from '@/lib/shops/actions'

interface VerificationDocumentCardProps {
  shopId: string
  verificationStatus: string
  subscriptionStatus: string
  hasDocument: boolean
  documentUrl: string | null
}

const STATUS_HELP: Record<string, string> = {
  pending: 'Subí un documento que acredite tu comercio (habilitación, DNI del titular, factura de servicios) para que el equipo lo revise. Así podrás obtener el sello de verificado ✓',
  rejected: 'Tu verificación fue rechazada. Subí un documento nuevo o más claro para volver a solicitarla.',
}

export function VerificationDocumentCard({
  shopId,
  verificationStatus,
  subscriptionStatus,
  hasDocument,
  documentUrl,
}: VerificationDocumentCardProps) {
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    startTransition(async () => {
      try {
        const path = await uploadVerificationDocument(shopId, file)
        const result = await updateVerificationDocument(path)
        if (result.error) {
          toast.add({ title: 'No pudimos guardar el documento', description: result.error, type: 'error' })
          return
        }
        toast.add({ title: 'Documento enviado para revisión', type: 'success' })
      } catch (error) {
        toast.add({
          title: 'No pudimos subir el documento',
          description: error instanceof Error ? error.message : undefined,
          type: 'error',
        })
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  const isVerified = verificationStatus === 'verified'
  const isSubscriptionActive = subscriptionStatus === 'active'

  return (
    <Card id="verificacion" className="scroll-mt-20">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            <h2 className="text-sm font-medium text-muted-foreground">Verificación del comercio</h2>
          </div>
          <StatusBadge status={verificationStatus} />
        </div>

        {isVerified ? (
          isSubscriptionActive ? (
            <p className="text-sm text-muted-foreground">
              Tu comercio ya tiene el sello de verificado ✓
            </p>
          ) : (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
              <p className="text-sm text-muted-foreground">
                Tu documento ya fue aprobado, pero el sello de verificado ✓ solo se muestra en
                comercios con un plan <strong>Básico</strong> o <strong>Ilimitado</strong> activo.
              </p>
              <Button size="sm" render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false}>
                Ver planes
              </Button>
            </div>
          )
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {STATUS_HELP[verificationStatus] ?? STATUS_HELP.pending}
            </p>

            {!isSubscriptionActive && (
              <p className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
                El sello de verificado ✓ se muestra en comercios con un plan{' '}
                <strong>Básico</strong> o <strong>Ilimitado</strong> activo. Podés subir tu
                documento igual — cuando lo aprobemos y tengas uno de esos planes, el sello se
                activa solo.
              </p>
            )}

            {hasDocument && (
              <a
                href={documentUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">Ver documento cargado</span>
              </a>
            )}

            <div>
              <input
                ref={inputRef}
                id="verification-document"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => inputRef.current?.click()}
              >
                <UploadCloud className="size-4" aria-hidden />
                {isPending
                  ? 'Subiendo...'
                  : hasDocument
                    ? 'Subir otro documento'
                    : 'Subir documento'}
              </Button>
              {fileName && !isPending && (
                <p className="mt-1 text-xs text-muted-foreground">Último archivo: {fileName}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Formatos aceptados: PNG, JPEG, WEBP o PDF. Máximo 10MB.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
