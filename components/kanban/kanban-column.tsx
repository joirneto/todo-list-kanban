'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Card, ColumnType } from '@/types/kanban'
import { KanbanCard } from './kanban-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useRef, useEffect } from 'react'

interface KanbanColumnProps {
  id: ColumnType
  title: string
  cards: Card[]
  onAddCard: (title: string, column: ColumnType) => void
  onDeleteCard: (id: number) => void
  onImagePaste: (id: number, imageData: string) => void
}

export function KanbanColumn({ 
  id, 
  title, 
  cards, 
  onAddCard, 
  onDeleteCard,
  onImagePaste 
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      column: id,
    }
  })

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim(), id)
      setNewCardTitle('')
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewCardTitle('')
    }
  }

  const columnColors = {
    todo: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      header: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-800 dark:text-amber-200',
      count: 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200',
    },
    done: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      header: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-800 dark:text-emerald-200',
      count: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200',
    },
  }

  const colors = columnColors[id]

  return (
    <div 
      className={`flex flex-col w-80 rounded-xl border-2 ${colors.border} ${colors.bg} ${
        isOver ? 'ring-2 ring-primary ring-offset-2' : ''
      } transition-all`}
    >
      <div className={`p-4 rounded-t-lg ${colors.header}`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-lg ${colors.text}`}>
            {title}
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${colors.count}`}>
            {cards.length}
          </span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 p-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto"
      >
        <SortableContext 
          items={cards.map(c => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {cards.map(card => (
              <KanbanCard 
                key={card.id} 
                card={card} 
                onDelete={onDeleteCard}
                onImagePaste={onImagePaste}
              />
            ))}
          </div>
        </SortableContext>

        {cards.length === 0 && !isAdding && (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            Nenhum card ainda
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/50">
        {isAdding ? (
          <div className="flex flex-col gap-2">
            <Input
              ref={inputRef}
              placeholder="Titulo do card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
              >
                Adicionar
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setIsAdding(false)
                  setNewCardTitle('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar card
          </Button>
        )}
      </div>
    </div>
  )
}
