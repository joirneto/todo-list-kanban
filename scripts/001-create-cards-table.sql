-- Criar tabela de cards do Kanban
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  column_id TEXT NOT NULL DEFAULT 'todo',
  image_data TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenação por coluna e posição
CREATE INDEX IF NOT EXISTS idx_cards_column_position ON cards(column_id, position);
