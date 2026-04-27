import type { Attachment, ContentPart } from '../types'

function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

export function readFileAsAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        resolve({
          id: nanoid(),
          name: file.name,
          type: 'image',
          mimeType: file.type,
          content: reader.result as string,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    } else {
      reader.onload = () => {
        const text = reader.result as string
        resolve({
          id: nanoid(),
          name: file.name,
          type: file.type === 'application/pdf' ? 'pdf' : 'text',
          mimeType: file.type,
          content: text,
        })
      }
      reader.onerror = reject
      reader.readAsText(file)
    }
  })
}

export function attachmentsToContentParts(text: string, attachments: Attachment[]): ContentPart[] {
  const parts: ContentPart[] = []

  // Images first
  for (const a of attachments) {
    if (a.type === 'image') {
      parts.push({ type: 'image_url', image_url: { url: a.content } })
    }
  }

  // Text/PDF content prepended to the user's message
  const textParts = attachments
    .filter((a) => a.type !== 'image')
    .map((a) => {
      const label = a.type === 'pdf' ? `[PDF: ${a.name}]\n` : `[File: ${a.name}]\n`
      return label + a.content
    })

  const fullText = [...textParts, text].filter(Boolean).join('\n\n')
  if (fullText) {
    parts.push({ type: 'text', text: fullText })
  }

  return parts
}
