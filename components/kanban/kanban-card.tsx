'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ImagePlus } from 'lucide-react'
import { Card } from '@/types/kanban'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent } from '@/components/ui/card'
import { useRef, useState } from 'react'

interface KanbanCardProps {
  card: Card
  onDelete: (id: number) => void
  onImagePaste: (id: number, imageData: string) => void
}

export function KanbanCard({ card, onDelete, onImagePaste }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ 
    id: card.id,
    data: {
      type: 'card',
      card,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableIsDragging ? 0.5 : 1,
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            onImagePaste(card.id, base64)
          }
          reader.readAsDataURL(blob)
        }
        break
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        onImagePaste(card.id, base64)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  return (
    <div ref={setNodeRef} style={style}>
      <UICard 
        ref={cardRef}
        className="group bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-default"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground break-words">
                {card.title}
              </p>
              
              {card.image_data && (
                <div className="mt-2 rounded-md overflow-hidden border border-border">
                  <img 
                    src={card.image_data} 
                    alt="Card attachment"
                    className="w-full h-auto max-h-48 object-contain bg-muted"
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Ctrl+V para colar imagem
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <span className="cursor-pointer">
                    <ImagePlus className="h-3.5 w-3.5" />
                  </span>
                </Button>
              </label>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(card.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </UICard>
    </div>
  )
}
