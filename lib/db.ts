import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export interface Card {
  id: string
  title: string
  description: string | null
  column_id: 'todo' | 'done'
  position: number
  image_data: string | null
  created_at: string
  updated_at: string
}

export async function getAllCards(): Promise<Card[]> {
  const cards = await sql`
    SELECT * FROM cards ORDER BY column_id, position ASC
  `
  return cards as Card[]
}

export async function getCardsByColumn(columnId: string): Promise<Card[]> {
  const cards = await sql`
    SELECT * FROM cards WHERE column_id = ${columnId} ORDER BY position ASC
  `
  return cards as Card[]
}

export async function createCard(title: string, columnId: string = 'todo', imageData?: string): Promise<Card> {
  const id = crypto.randomUUID()
  
  const maxPosResult = await sql`
    SELECT COALESCE(MAX(position), -1) as max_pos FROM cards WHERE column_id = ${columnId}
  `
  const position = (maxPosResult[0]?.max_pos ?? -1) + 1

  const result = await sql`
    INSERT INTO cards (id, title, column_id, position, image_data)
    VALUES (${id}, ${title}, ${columnId}, ${position}, ${imageData || null})
    RETURNING *
  `
  return result[0] as Card
}

export async function updateCard(
  id: string,
  updates: Partial<{
    title: string
    description: string
    image_data: string
  }>
): Promise<Card | null> {
  const card = await getCardById(id)
  if (!card) return null

  const result = await sql`
    UPDATE cards 
    SET 
      title = ${updates.title ?? card.title},
      description = ${updates.description ?? card.description},
      image_data = ${updates.image_data ?? card.image_data},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] as Card
}

export async function deleteCard(id: string): Promise<boolean> {
  const card = await getCardById(id)
  if (!card) return false

  await sql`DELETE FROM cards WHERE id = ${id}`

  // Update positions in the column
  await sql`
    UPDATE cards 
    SET position = position - 1 
    WHERE column_id = ${card.column_id} AND position > ${card.position}
  `

  return true
}

export async function moveCard(cardId: string, targetColumn: string, newPosition: number): Promise<void> {
  const card = await getCardById(cardId)
  if (!card) return

  const oldColumn = card.column_id
  const oldPosition = card.position

  if (oldColumn === targetColumn) {
    // Moving within same column
    if (oldPosition < newPosition) {
      await sql`
        UPDATE cards 
        SET position = position - 1 
        WHERE column_id = ${targetColumn} 
          AND position > ${oldPosition} 
          AND position <= ${newPosition}
      `
    } else if (oldPosition > newPosition) {
      await sql`
        UPDATE cards 
        SET position = position + 1 
        WHERE column_id = ${targetColumn} 
          AND position >= ${newPosition} 
          AND position < ${oldPosition}
      `
    }
  } else {
    // Moving to different column
    await sql`
      UPDATE cards 
      SET position = position - 1 
      WHERE column_id = ${oldColumn} 
        AND position > ${oldPosition}
    `

    await sql`
      UPDATE cards 
      SET position = position + 1 
      WHERE column_id = ${targetColumn} 
        AND position >= ${newPosition}
    `
  }

  await sql`
    UPDATE cards 
    SET column_id = ${targetColumn}, position = ${newPosition}, updated_at = NOW()
    WHERE id = ${cardId}
  `
}

export async function getCardById(id: string): Promise<Card | null> {
  const result = await sql`
    SELECT * FROM cards WHERE id = ${id}
  `
  return (result[0] as Card) || null
}
