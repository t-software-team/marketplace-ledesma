'use client'

import Image from 'next/image'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, PawPrint, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { uploadShopImage } from '@/lib/shops/upload-image'
import type { PatientActionState } from '@/lib/patients/actions'

interface PatientFormProps {
  shopId: string
  action: (state: PatientActionState, formData: FormData) => Promise<PatientActionState>
  defaultValues?: {
    name: string
    species: string | null
    breed: string | null
    sex: string | null
    birth_date: string | null
    weight: number | null
    photo_url: string | null
    owner_name: string | null
    owner_email: string | null
    owner_phone: string | null
  }
  submitLabel: string
}

const initialState: PatientActionState = { error: null }

export function PatientForm({ shopId, action, defaultValues, submitLabel }: PatientFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [photoUrl, setPhotoUrl] = useState(defaultValues?.photo_url ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fieldErrors = state.fieldErrors ?? {}

  useEffect(() => {
    if (state.error) {
      toast.add({ title: 'No pudimos guardar el paciente', description: state.error, type: 'error' })
    }
  }, [state])

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploading(true)
    setPhotoError(null)
    try {
      const url = await uploadShopImage('patient-photos', shopId, file)
      setPhotoUrl(url)
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'No pudimos subir la foto')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form action={formAction} className="space-y-6 pb-20 sm:pb-4">
      <input type="hidden" name="photo_url" value={photoUrl} />

      <section className="space-y-4">
        <h2 className="font-heading text-base">Datos básicos</h2>

        <div className="space-y-2">
          <label htmlFor="name" className="text-base font-medium sm:text-sm">
            Nombre
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            required
            aria-invalid={Boolean(fieldErrors.name)}
          />
          <FieldError message={fieldErrors.name} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="species" className="text-base font-medium sm:text-sm">
              Especie
            </label>
            <Input id="species" name="species" defaultValue={defaultValues?.species ?? ''} />
            <FieldError message={fieldErrors.species} />
          </div>
          <div className="space-y-2">
            <label htmlFor="breed" className="text-base font-medium sm:text-sm">
              Raza
            </label>
            <Input id="breed" name="breed" defaultValue={defaultValues?.breed ?? ''} />
            <FieldError message={fieldErrors.breed} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="sex" className="text-base font-medium sm:text-sm">
              Sexo
            </label>
            <Input id="sex" name="sex" defaultValue={defaultValues?.sex ?? ''} />
            <FieldError message={fieldErrors.sex} />
          </div>
          <div className="space-y-2">
            <label htmlFor="birth_date" className="text-base font-medium sm:text-sm">
              Nacimiento
            </label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              defaultValue={defaultValues?.birth_date ?? ''}
              aria-invalid={Boolean(fieldErrors.birth_date)}
            />
            <FieldError message={fieldErrors.birth_date} />
          </div>
          <div className="space-y-2">
            <label htmlFor="weight" className="text-base font-medium sm:text-sm">
              Peso (kg)
            </label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="0"
              defaultValue={defaultValues?.weight ?? ''}
              aria-invalid={Boolean(fieldErrors.weight)}
            />
            <FieldError message={fieldErrors.weight} />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="font-heading text-base">Foto</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label={photoUrl ? 'Cambiar foto del paciente' : 'Subir foto del paciente'}
            className="group relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted disabled:pointer-events-none disabled:opacity-70"
          >
            {photoUrl ? (
              <Image src={photoUrl} alt="Foto del paciente" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <PawPrint className="size-8" aria-hidden />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-background/0 text-transparent transition-colors group-hover:bg-background/60 group-hover:text-foreground">
              {isUploading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-5" aria-hidden />
              )}
            </div>
          </button>
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? 'Subiendo...' : photoUrl ? 'Cambiar foto' : 'Subir foto'}
              </Button>
              {photoUrl && !isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Quitar foto"
                  onClick={() => setPhotoUrl('')}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPEG, WEBP o GIF. Hasta 5MB.</p>
            {photoError && <p className="text-xs text-destructive">{photoError}</p>}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handlePhotoChange}
          disabled={isUploading}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="font-heading text-base">Dueño</h2>

        <div className="space-y-2">
          <label htmlFor="owner_name" className="text-base font-medium sm:text-sm">
            Nombre del dueño
          </label>
          <Input id="owner_name" name="owner_name" defaultValue={defaultValues?.owner_name ?? ''} />
          <FieldError message={fieldErrors.owner_name} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="owner_phone" className="text-base font-medium sm:text-sm">
              Teléfono
            </label>
            <Input id="owner_phone" name="owner_phone" defaultValue={defaultValues?.owner_phone ?? ''} />
            <FieldError message={fieldErrors.owner_phone} />
          </div>
          <div className="space-y-2">
            <label htmlFor="owner_email" className="text-base font-medium sm:text-sm">
              Email
            </label>
            <Input
              id="owner_email"
              name="owner_email"
              type="email"
              defaultValue={defaultValues?.owner_email ?? ''}
              aria-invalid={Boolean(fieldErrors.owner_email)}
            />
            <FieldError message={fieldErrors.owner_email} />
          </div>
        </div>
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-4 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" disabled={isPending || isUploading} className="w-full sm:w-auto">
          {isPending ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
