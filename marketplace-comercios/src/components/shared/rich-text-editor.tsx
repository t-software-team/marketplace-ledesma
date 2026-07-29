'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  name: string
  initialValue?: string | null
  placeholder?: string
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        active && 'bg-muted text-foreground'
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ name, initialValue = '', placeholder }: RichTextEditorProps) {
  const [html, setHtml] = useState(initialValue ?? '')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: initialValue || '',
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-24 rounded-b-lg border border-t-0 border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-3 focus:ring-ring/50 [&_p]:my-1',
      },
    },
  })

  if (!editor) {
    return (
      <div className="min-h-32 rounded-lg border border-input bg-muted/30" aria-hidden />
    )
  }

  return (
    <div>
      <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 border-input bg-muted/30 p-1">
        <ToolbarButton
          label="Negrita"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL del link')
            if (!url) return
            editor.chain().focus().setLink({ href: url }).run()
          }}
        >
          <LinkIcon className="size-3.5" aria-hidden />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  )
}
