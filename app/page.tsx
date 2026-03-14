'use client'

import { KanbanBoard } from '@/components/kanban/kanban-board'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

export default function Home() {
  const boardRef = useRef<HTMLDivElement>(null)

  const exportToPDF = async () => {
    if (!boardRef.current) return

    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas-pro')

    const element = boardRef.current

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save('teste-dict-bacen.pdf')
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/bacen-logo.jpg"
                  alt="Bacen"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <Image
                  src="/images/pix-logo.jpg"
                  alt="Pix"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Teste Dict Bacen - Vamos passar!
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Arraste os cards entre as colunas. Cole imagens com Ctrl+V.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={exportToPDF} variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sincronizando
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto" ref={boardRef}>
        <KanbanBoard />
      </div>
    </main>
  )
}