import React, { useState } from 'react'
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  CheckCircle,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface IntegratedPdfViewerProps {
  title: string
  pdfUrl: string
  isMandatoryReading?: boolean
  allowDownload?: boolean
  onReadingCompleted?: () => void
  totalPagesEstimated?: number
}

export const IntegratedPdfViewer: React.FC<IntegratedPdfViewerProps> = ({
  title,
  pdfUrl,
  isMandatoryReading = false,
  allowDownload = true,
  onReadingCompleted,
  totalPagesEstimated = 12,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasConfirmedRead, setHasConfirmedRead] = useState(false)

  const handleNextPage = () => {
    if (currentPage < totalPagesEstimated) {
      setCurrentPage((p) => p + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1)
    }
  }

  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel((z) => z + 15)
  }

  const handleZoomOut = () => {
    if (zoomLevel > 70) setZoomLevel((z) => z - 15)
  }

  const handleMarkAsRead = () => {
    setHasConfirmedRead(true)
    if (onReadingCompleted) {
      onReadingCompleted()
    }
  }

  return (
    <div
      className={`rounded-xl border border-[#294149] bg-[#0C1317] flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full my-4'
      }`}
    >
      {/* Barra Superior / Controles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#294149] bg-[#152228] px-4 py-2.5 text-xs text-white">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-[#01B59A] shrink-0" />
          <span className="font-semibold truncate max-w-xs sm:max-w-md">{title}</span>
          {isMandatoryReading && (
            <Badge className="bg-[#C69B4B] text-black text-[9px] font-mono uppercase font-bold">
              Leitura Obrigatória
            </Badge>
          )}
        </div>

        {/* Paginação e Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0C1317] rounded border border-[#294149] px-2 py-1 gap-1 text-[11px] font-mono">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-0.5 hover:text-[#01B59A] disabled:opacity-30"
              title="Página anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>
              {currentPage} / {totalPagesEstimated}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPagesEstimated}
              className="p-0.5 hover:text-[#01B59A] disabled:opacity-30"
              title="Próxima página"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center bg-[#0C1317] rounded border border-[#294149] px-1.5 py-1 gap-1 text-[11px] font-mono">
            <button
              onClick={handleZoomOut}
              className="p-0.5 hover:text-[#01B59A]"
              title="Reduzir zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span>{zoomLevel}%</span>
            <button
              onClick={handleZoomIn}
              className="p-0.5 hover:text-[#01B59A]"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-[#A8BBC0] hover:text-white"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>

          {allowDownload && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-[#294149]/60 hover:bg-[#294149] text-[11px] font-medium text-white transition-colors"
              title="Download autorizado"
            >
              <Download className="h-3 w-3 text-[#01B59A]" />
              <span className="hidden sm:inline">Baixar</span>
            </a>
          )}
        </div>
      </div>

      {/* Área de Visualização do PDF */}
      <div className="relative bg-[#1A1E22] overflow-auto flex items-center justify-center min-h-[460px] max-h-[70vh]">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="w-full h-full min-h-[500px] flex items-center justify-center p-2 transition-transform duration-150"
        >
          <iframe
            src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
            title={title}
            className="w-full min-h-[500px] rounded border border-[#294149] bg-white shadow-lg"
          />
        </div>
      </div>

      {/* Barra Inferior / Conclusão de Leitura e LGPD/Segurança */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#294149] bg-[#152228] px-4 py-3 text-xs">
        <div className="flex items-center gap-2 text-[11px] text-[#A8BBC0]">
          <Shield className="h-3.5 w-3.5 text-[#01B59A]" />
          <span>Acesso protegido via Supabase Storage & Entitlement verificado</span>
        </div>

        <div className="flex items-center gap-2">
          {hasConfirmedRead ? (
            <div className="flex items-center gap-1.5 text-[#01B59A] text-xs font-semibold">
              <CheckCircle className="h-4 w-4" /> Leitura confirmada no histórico
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleMarkAsRead}
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs h-8"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Concluir e Registrar Leitura
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
