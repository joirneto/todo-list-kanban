import { KanbanBoard } from '@/components/kanban/kanban-board'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Kanban Board
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Arraste os cards entre as colunas. Cole imagens com Ctrl+V.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizando automaticamente
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto">
        <KanbanBoard />
      </div>
    </main>
  )
}
