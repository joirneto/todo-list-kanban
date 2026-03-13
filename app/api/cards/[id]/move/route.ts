import { NextRequest, NextResponse } from 'next/server'
import { moveCard, getAllCards } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const body = await request.json()
    const { targetColumn, newPosition } = body
    
    if (!targetColumn || typeof newPosition !== 'number') {
      return NextResponse.json(
        { error: 'targetColumn and newPosition are required' }, 
        { status: 400 }
      )
    }
    
    await moveCard(id, targetColumn, newPosition)
    const cards = await getAllCards()
    
    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error moving card:', error)
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 })
  }
}
