import { NextRequest, NextResponse } from 'next/server'
import { updateCard, deleteCard } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const body = await request.json()
    const card = await updateCard(id, body)
    
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    
    return NextResponse.json(card)
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const success = await deleteCard(id)
    
    if (!success) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
  }
}
