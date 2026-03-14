'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ImagePlus, X, Download } from 'lucide-react'
import { Card } from '@/types/kanban'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent } from '@/components/ui/card'
import { useRef, useState, useEffect } from 'react'

interface KanbanCardProps {
  card: Card
  onDelete: (id: string) => void
  onImagePaste: (id: string, imageData: string) => void
}

export function KanbanCard({ card, onDelete, onImagePaste }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
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

  const handleDownloadImage = () => {
    if (!card.image_data) return
    
    const link = document.createElement('a')
    link.href = card.image_data
    link.download = `${card.title.replace(/[^a-z0-9]/gi, '_')}_image.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const cardBgColor = card.color || undefined

  // Calcular se o texto deve ser claro ou escuro baseado na cor de fundo
  const getContrastColor = (hexColor: string | undefined) => {
    if (!hexColor) return undefined
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
  }

  const textColor = getContrastColor(card.color)

  // Fechar modal com ESC
  useEffect(() => {
    if (!showImageModal) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowImageModal(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showImageModal])

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <UICard 
          ref={cardRef}
          className="group shadow-sm hover:shadow-md transition-shadow cursor-default border-border"
          style={{ backgroundColor: cardBgColor, color: textColor }}
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
                <p className="text-sm font-medium break-words" style={{ color: textColor || 'inherit' }}>
                  {card.title}
                </p>
                
                {card.image_data && (
                  <div 
                    className="mt-2 rounded-md overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowImageModal(true)}
                  >
                    <img 
                      src={card.image_data} 
                      alt="Card attachment"
                      className="w-full h-auto max-h-48 object-contain bg-muted"
                    />
                  </div>
                )}
                
                <p className="text-xs mt-2" style={{ color: textColor ? `${textColor}99` : undefined }}>
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

      {/* Modal de visualizacao da imagem */}
      {showImageModal && card.image_data && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={handleDownloadImage}
                title="Baixar imagem"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowImageModal(false)}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img 
              src={card.image_data} 
              alt="Card attachment"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
