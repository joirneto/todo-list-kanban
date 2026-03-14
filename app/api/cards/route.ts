import { NextRequest, NextResponse } from 'next/server'
import { getAllCards, createCard } from '@/lib/db'

export async function GET() {
  try {
    const cards = await getAllCards()
    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, column = 'todo', image_data, color } = body
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    const card = await createCard(title.trim(), column, image_data, color)
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }
}
