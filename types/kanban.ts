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

export type ColumnType = 'todo' | 'done'

export interface Column {
  id: ColumnType
  title: string
}
