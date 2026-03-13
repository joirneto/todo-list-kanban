'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import useSWR from 'swr'
import { Card, ColumnType } from '@/types/kanban'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { Spinner } from '@/components/ui/spinner'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const COLUMNS: { id: ColumnType; title: string }[] = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'done', title: 'Concluido' },
]

export function KanbanBoard() {
  const { data: cards, error, mutate, isLoading } = useSWR<Card[]>('/api/cards', fetcher, {
    refreshInterval: 3000, // Atualiza a cada 3 segundos para sync com outros usuarios
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

  const getCardsByColumn = useCallback((column: ColumnType) => {
    return localCards
      .filter(card => card.column === column)
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

    const activeId = active.id as number
    const overId = over.id

    const activeCard = localCards.find(c => c.id === activeId)
    if (!activeCard) return

    // Verifica se estamos sobre uma coluna ou um card
    const overCard = localCards.find(c => c.id === overId)
    const overColumn = overCard ? overCard.column : (overId as ColumnType)

    if (activeCard.column !== overColumn) {
      setLocalCards(prev => {
        const newCards = prev.map(card => {
          if (card.id === activeId) {
            return { ...card, column: overColumn }
          }
          return card
        })
        return newCards
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as number
    const overId = over.id

    const activeCard = localCards.find(c => c.id === activeId)
    if (!activeCard) return

    // Determina a coluna de destino
    const overCard = localCards.find(c => c.id === overId)
    const targetColumn = overCard ? overCard.column : (overId as ColumnType)

    // Calcula a nova posicao
    const columnCards = localCards
      .filter(c => c.column === targetColumn && c.id !== activeId)
      .sort((a, b) => a.position - b.position)

    let newPosition: number
    if (overCard) {
      newPosition = columnCards.findIndex(c => c.id === overId)
      if (newPosition === -1) newPosition = columnCards.length
    } else {
      newPosition = columnCards.length
    }

    // Atualiza localmente primeiro (optimistic update)
    setLocalCards(prev => {
      const newCards = [...prev]
      const cardIndex = newCards.findIndex(c => c.id === activeId)
      if (cardIndex !== -1) {
        newCards[cardIndex] = {
          ...newCards[cardIndex],
          column: targetColumn,
          position: newPosition,
        }
      }
      return newCards
    })

    // Envia para o servidor
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
      mutate() // Recarrega do servidor em caso de erro
    }
  }

  const handleAddCard = async (title: string, column: ColumnType) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, column }),
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

  const handleDeleteCard = async (id: number) => {
    // Optimistic update
    setLocalCards(prev => prev.filter(c => c.id !== id))
    
    try {
      await fetch(`/api/cards/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Error deleting card:', error)
      mutate()
    }
  }

  const handleImagePaste = async (cardId: number, imageData: string) => {
    // Optimistic update
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
      <div className="flex gap-6 p-6 overflow-x-auto">
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
