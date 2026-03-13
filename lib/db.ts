import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'kanban.db')
const db = new Database(dbPath)

// Inicializa as tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    column TEXT NOT NULL DEFAULT 'todo',
    position INTEGER NOT NULL DEFAULT 0,
    image_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export interface Card {
  id: number
  title: string
  description: string | null
  column: 'todo' | 'done'
  position: number
  image_data: string | null
  created_at: string
  updated_at: string
}

export function getAllCards(): Card[] {
  const stmt = db.prepare('SELECT * FROM cards ORDER BY position ASC')
  return stmt.all() as Card[]
}

export function getCardsByColumn(column: string): Card[] {
  const stmt = db.prepare('SELECT * FROM cards WHERE column = ? ORDER BY position ASC')
  return stmt.all(column) as Card[]
}

export function createCard(title: string, column: string = 'todo', imageData?: string): Card {
  const maxPositionStmt = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 as nextPos FROM cards WHERE column = ?')
  const { nextPos } = maxPositionStmt.get(column) as { nextPos: number }
  
  const stmt = db.prepare(`
    INSERT INTO cards (title, column, position, image_data) 
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(title, column, nextPos, imageData || null)
  
  const getStmt = db.prepare('SELECT * FROM cards WHERE id = ?')
  return getStmt.get(result.lastInsertRowid) as Card
}

export function updateCard(id: number, updates: Partial<Omit<Card, 'id' | 'created_at'>>): Card | null {
  const fields: string[] = []
  const values: unknown[] = []
  
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.column !== undefined) {
    fields.push('column = ?')
    values.push(updates.column)
  }
  if (updates.position !== undefined) {
    fields.push('position = ?')
    values.push(updates.position)
  }
  if (updates.image_data !== undefined) {
    fields.push('image_data = ?')
    values.push(updates.image_data)
  }
  
  if (fields.length === 0) return null
  
  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)
  
  const stmt = db.prepare(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`)
  stmt.run(...values)
  
  const getStmt = db.prepare('SELECT * FROM cards WHERE id = ?')
  return getStmt.get(id) as Card
}

export function moveCard(cardId: number, targetColumn: string, newPosition: number): void {
  const transaction = db.transaction(() => {
    // Pega o card atual
    const cardStmt = db.prepare('SELECT * FROM cards WHERE id = ?')
    const card = cardStmt.get(cardId) as Card | undefined
    if (!card) return
    
    const oldColumn = card.column
    const oldPosition = card.position
    
    if (oldColumn === targetColumn) {
      // Movendo dentro da mesma coluna
      if (oldPosition < newPosition) {
        // Movendo para baixo
        const updateStmt = db.prepare(`
          UPDATE cards SET position = position - 1 
          WHERE column = ? AND position > ? AND position <= ?
        `)
        updateStmt.run(targetColumn, oldPosition, newPosition)
      } else if (oldPosition > newPosition) {
        // Movendo para cima
        const updateStmt = db.prepare(`
          UPDATE cards SET position = position + 1 
          WHERE column = ? AND position >= ? AND position < ?
        `)
        updateStmt.run(targetColumn, newPosition, oldPosition)
      }
    } else {
      // Movendo para outra coluna
      // Atualiza posições na coluna antiga
      const updateOldStmt = db.prepare(`
        UPDATE cards SET position = position - 1 
        WHERE column = ? AND position > ?
      `)
      updateOldStmt.run(oldColumn, oldPosition)
      
      // Abre espaço na nova coluna
      const updateNewStmt = db.prepare(`
        UPDATE cards SET position = position + 1 
        WHERE column = ? AND position >= ?
      `)
      updateNewStmt.run(targetColumn, newPosition)
    }
    
    // Atualiza o card
    const finalStmt = db.prepare(`
      UPDATE cards SET column = ?, position = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    finalStmt.run(targetColumn, newPosition, cardId)
  })
  
  transaction()
}

export function deleteCard(id: number): boolean {
  const cardStmt = db.prepare('SELECT * FROM cards WHERE id = ?')
  const card = cardStmt.get(id) as Card | undefined
  if (!card) return false
  
  const transaction = db.transaction(() => {
    // Remove o card
    const deleteStmt = db.prepare('DELETE FROM cards WHERE id = ?')
    deleteStmt.run(id)
    
    // Atualiza posições
    const updateStmt = db.prepare(`
      UPDATE cards SET position = position - 1 
      WHERE column = ? AND position > ?
    `)
    updateStmt.run(card.column, card.position)
  })
  
  transaction()
  return true
}

export default db
