'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { uploadPatientDocument } from '@/lib/shops/upload-image'
import { createPatientNote, type PatientNoteActionState } from '@/lib/patients/notes-actions'

interface AddNoteDialogProps {
  shopId: string
  patientId: string
}

const initialState: PatientNoteActionState = { error: null }

const ALLOWED_ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

export function AddNoteDialog({ shopId, patientId }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<PatientNoteActionState>(initialState)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fieldErrors = state.fieldErrors ?? {}

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files
    if (!selected || selected.length === 0) return

    const incoming = Array.from(selected)
    const invalid = incoming.find(
      (file) => !ALLOWED_ATTACHMENT_TYPES.includes(file.type) || file.size > MAX_ATTACHMENT_SIZE
    )

    if (invalid) {
      setUploadError('Cada adjunto debe ser una imagen o un PDF de hasta 10MB')
      event.target.value = ''
      return
    }

    setUploadError(null)
    setFiles((prev) => [...prev, ...incoming])
    event.target.value = ''
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(formData: FormData) {
    setUploadError(null)
    startTransition(async () => {
      let attachments: { url: string; file_name: string }[] = []

      if (files.length > 0) {
        setIsUploading(true)
        try {
          attachments = await Promise.all(
            files.map(async (file) => ({
              url: await uploadPatientDocument(shopId, patientId, file),
              file_name: file.name,
            }))
          )
        } catch (error) {
          setIsUploading(false)
          console.error('AddNoteDialog: fallo al subir adjuntos', { shopId, patientId, error })
          const message = error instanceof Error ? error.message : 'No pudimos subir los adjuntos'
          setUploadError(message)
          toast.add({ title: 'No pudimos subir los adjuntos', description: message, type: 'error' })
          return
        }
        setIsUploading(false)
      }

      const result = await createPatientNote(patientId, attachments, initialState, formData)
      setState(result)
      if (result.error) {
        toast.add({ title: 'No pudimos guardar la nota', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Nota agregada', type: 'success' })
        setFiles([])
        setOpen(false)
      }
    })
  }

  const isBusy = isPending || isUploading

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nueva nota</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva nota de historial</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Contenido
            </label>
            <Textarea id="content" name="content" required aria-invalid={Boolean(fieldErrors.content)} rows={5} />
            <FieldError message={fieldErrors.content} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adjuntos</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" aria-hidden />
              Agregar archivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              multiple
              onChange={handleFilesChange}
              disabled={isBusy}
              className="hidden"
              aria-hidden="true"
            />
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isBusy}
                      aria-label={`Quitar ${file.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            <p className="text-xs text-muted-foreground">Imágenes o PDF. Hasta 10MB por archivo.</p>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={isBusy} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Subiendo...
              </>
            ) : isPending ? (
              'Guardando...'
            ) : (
              'Guardar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
