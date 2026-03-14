'use client'

import { Spinner } from '@/components/ui/spinner'
import { Card, ColumnType } from '@/types/kanban'
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { KanbanCard } from './kanban-card'
import { KanbanColumn } from './kanban-column'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const COLUMNS: { id: ColumnType; title: string }[] = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'done', title: 'Concluído' },
]

export function KanbanBoard() {
  const { data: cards, error, mutate, isLoading } = useSWR<Card[]>('/api/cards', fetcher, {
    refreshInterval: 3000,
  })
  
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [localCards, setLocalCards] = useState<Card[]>([])

  useEffect(() => {
    if (cards) {
      setLocalCards(cards)
    }
  }, [cards])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getCardsByColumn = useCallback((columnId: ColumnType) => {
    return localCards
      .filter(card => card.column_id === columnId)
      .sort((a, b) => a.position - b.position)
  }, [localCards])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = localCards.find(c => c.id === active.id)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id

    const activeCard = localCards.find(c => c.id === activeId)
    if (!activeCard) return

    const overCard = localCards.find(c => c.id === overId)
    const overColumn = overCard ? overCard.column_id : (overId as ColumnType)

    if (activeCard.column_id !== overColumn) {
      setLocalCards(prev => {
        return prev.map(card => {
          if (card.id === activeId) {
            return { ...card, column_id: overColumn }
          }
          return card
        })
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id

    const activeCard = localCards.find(c => c.id === activeId)
    if (!activeCard) return

    const overCard = localCards.find(c => c.id === overId)
    const targetColumn = overCard ? overCard.column_id : (overId as ColumnType)

    const columnCards = localCards
      .filter(c => c.column_id === targetColumn && c.id !== activeId)
      .sort((a, b) => a.position - b.position)

    let newPosition: number
    if (overCard) {
      newPosition = columnCards.findIndex(c => c.id === overId)
      if (newPosition === -1) newPosition = columnCards.length
    } else {
      newPosition = columnCards.length
    }

    setLocalCards(prev => {
      const newCards = [...prev]
      const cardIndex = newCards.findIndex(c => c.id === activeId)
      if (cardIndex !== -1) {
        newCards[cardIndex] = {
          ...newCards[cardIndex],
          column_id: targetColumn,
          position: newPosition,
        }
      }
      return newCards
    })

    try {
      const response = await fetch(`/api/cards/${activeId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetColumn,
          newPosition,
        }),
      })
      
      if (response.ok) {
        const updatedCards = await response.json()
        setLocalCards(updatedCards)
        mutate(updatedCards, false)
      }
    } catch (error) {
      console.error('Error moving card:', error)
      mutate()
    }
  }

  const handleAddCard = async (title: string, columnId: ColumnType, color: string) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, column: columnId, color }),
      })
      
      if (response.ok) {
        const newCard = await response.json()
        setLocalCards(prev => [...prev, newCard])
        mutate()
      }
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleDeleteCard = async (id: string) => {
    setLocalCards(prev => prev.filter(c => c.id !== id))
    
    try {
      await fetch(`/api/cards/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Error deleting card:', error)
      mutate()
    }
  }

  const handleImagePaste = async (cardId: string, imageData: string) => {
    setLocalCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, image_data: imageData } : c
    ))

    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageData }),
      })
      mutate()
    } catch (error) {
      console.error('Error updating card image:', error)
      mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Erro ao carregar cards. Tente novamente.
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div id="kanban-board" className="flex gap-6 p-6 items-stretch">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            cards={getCardsByColumn(column.id)}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onImagePaste={handleImagePaste}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-3 scale-105">
            <KanbanCard 
              card={activeCard} 
              onDelete={() => {}} 
              onImagePaste={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
