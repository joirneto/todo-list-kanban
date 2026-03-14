export interface Card {
  id: string
  title: string
  description: string | null
  column_id: 'todo' | 'done'
  position: number
  image_data: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export type ColumnType = 'todo' | 'done'

export interface Column {
  id: ColumnType
  title: string
}

export const CARD_COLORS = [
  { name: 'Preto', value: '#1f2933' },
  { name: 'Cinza', value: '#e5e7eb' },
  { name: 'Marrom', value: '#d6b38a' },
  { name: 'Vermelho', value: '#fecaca' },
  { name: 'Laranja', value: '#fed7aa' },
  { name: 'Amarelo', value: '#fef08a' },
  { name: 'Verde', value: '#bbf7d0' },
  { name: 'Azul', value: '#bfdbfe' },
  { name: 'Roxo', value: '#ddd6fe' },
  { name: 'Rosa', value: '#fbcfe8' },
  { name: 'Dourado', value: '#fde68a' },
] as const
