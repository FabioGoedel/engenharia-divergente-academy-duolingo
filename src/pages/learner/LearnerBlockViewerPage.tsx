import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Eye,
  Sliders,
  Layers,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ContentBlock, BlockTypeId } from '@/types/cms'
import { BlockService } from '@/services/blockService'
import { getBlockDefinition, getAllBlockDefinitions } from '@/components/cms/BlockRegistry'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const LearnerBlockViewerPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const blockIdParam = searchParams.get('id')
  const blockTypeParam = searchParams.get('type')

  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const allDefinitions = getAllBlockDefinitions().filter((d) => d.priority === 'P0')

  const loadAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await BlockService.listBlocks()
      setBlocks(data)

      if (blockIdParam) {
        const found = data.find((b) => b.id === blockIdParam)
        if (found) {
          setSelectedBlock(found)
        } else {
          setError(`Bloco ID "${blockIdParam}" não encontrado no catálogo.`)
        }
      } else if (blockTypeParam) {
        const found = data.find((b) => b.blockType === blockTypeParam)
        if (found) {
          setSelectedBlock(found)
        } else {
          // Cria instância de demonstração em memória para o tipo solicitado
          const def = getBlockDefinition(blockTypeParam as BlockTypeId)
          if (def) {
            setSelectedBlock({
              id: `preview-${def.type}`,
              blockType: def.type,
              category: def.category,
              title: `Demonstração: ${def.title}`,
              description: def.description,
              editorialStatus: 'published',
              version: 1,
              config: def.defaultConfig,
              completionPolicy: def.completionPolicy,
              tags: ['Demonstração', 'Aluno'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDemo: true,
            })
          }
        }
      } else if (data.length > 0) {
        setSelectedBlock(data[0])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar blocos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [blockIdParam, blockTypeParam])

  const handleSelectBlock = (b: ContentBlock) => {
    setSelectedBlock(b)
    setCompleted(false)
    setSearchParams({ id: b.id })
  }

  const handleSelectTypeDemo = (typeId: BlockTypeId) => {
    setSearchParams({ type: typeId })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Topo / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="text-xs text-[#A8BBC0] hover:text-[#01B59A] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Painel
            </Link>
            <span className="text-[#A8BBC0]">•</span>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              Experiência do Aluno (Fase 2)
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Visualizador de Blocos Didáticos
          </h1>
          <p className="text-xs text-[#A8BBC0]">
            Renderização interativa de qualquer bloco P0 no contexto de aprendizagem do aluno, com
            acessibilidade e feedback imediato.
          </p>
        </div>

        {/* Seletor Rápido de Blocos P0 */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBlock?.blockType || ''}
            onChange={(e) => handleSelectTypeDemo(e.target.value as BlockTypeId)}
            className="h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="" disabled>
              Alternar Tipo P0 ({allDefinitions.length} disponíveis)
            </option>
            {allDefinitions.map((d) => (
              <option key={d.type} value={d.type}>
                {d.title} ({d.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estados: Loading, Error, Empty, Success */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#01B59A] border-t-transparent" />
          <p className="text-xs text-[#A8BBC0] uppercase tracking-wider font-mono">
            Carregando bloco de aprendizagem...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#C86F63]/50 bg-[#C86F63]/10 p-6 space-y-3 text-center">
          <AlertTriangle className="h-8 w-8 text-[#C86F63] mx-auto" />
          <h3 className="text-base font-bold text-white">Falha ao carregar conteúdo</h3>
          <p className="text-xs text-[#A8BBC0]">{error}</p>
          <Button
            onClick={loadAll}
            variant="outline"
            size="sm"
            className="text-xs border-[#C86F63] text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tentar Novamente
          </Button>
        </div>
      ) : !selectedBlock ? (
        <div className="rounded-xl border border-dashed border-[#294149] bg-[#152228]/40 p-12 text-center space-y-3">
          <Boxes className="h-10 w-10 text-[#A8BBC0] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">Nenhum bloco selecionado</h3>
          <p className="text-xs text-[#A8BBC0]">
            Escolha um dos tipos do catálogo P0 para interagir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna Principal: Renderer do Bloco */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-[#294149] bg-[#0C1317] p-6 shadow-xl space-y-4">
              {/* Cabeçalho do Bloco */}
              <div className="flex items-center justify-between border-b border-[#294149] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#01B59A] bg-[#152228] px-2 py-0.5 rounded border border-[#294149]">
                      {selectedBlock.blockType}
                    </span>
                    <span className="text-[10px] font-mono text-[#A8BBC0]">
                      v{selectedBlock.version}
                    </span>
                    {completed && (
                      <Badge className="bg-[#01B59A] text-black text-[9px] uppercase font-mono font-bold">
                        Concluído
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedBlock.title}</h2>
                </div>
              </div>

              {/* Componente Renderer P0 Específico */}
              {(() => {
                const def = getBlockDefinition(selectedBlock.blockType)
                if (!def) {
                  return (
                    <div className="p-4 rounded border border-[#C86F63] bg-[#C86F63]/10 text-xs text-[#C86F63]">
                      Renderer para o tipo "{selectedBlock.blockType}" não está registrado.
                    </div>
                  )
                }
                const StudentComponent = def.StudentComponent
                return (
                  <div className="pt-2">
                    <StudentComponent
                      config={selectedBlock.config}
                      onComplete={() => setCompleted(true)}
                    />
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Coluna Lateral: Metadados & Lista de Blocos */}
          <div className="space-y-4">
            {/* Metadados Técnicos */}
            <div className="rounded-xl border border-[#294149] bg-[#152228]/70 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-[#01B59A]" /> Detalhes do Bloco
              </h3>
              <div className="space-y-2 text-[11px] text-[#A8BBC0]">
                <div className="flex justify-between border-b border-[#294149]/50 pb-1">
                  <span>Categoria:</span>
                  <span className="font-mono text-white">{selectedBlock.category}</span>
                </div>
                <div className="flex justify-between border-b border-[#294149]/50 pb-1">
                  <span>Conclusão:</span>
                  <span className="font-mono text-white">{selectedBlock.completionPolicy}</span>
                </div>
                <div className="flex justify-between border-b border-[#294149]/50 pb-1">
                  <span>Status:</span>
                  <span className="font-mono text-[#01B59A]">{selectedBlock.editorialStatus}</span>
                </div>
                {selectedBlock.trackReferences && selectedBlock.trackReferences.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-[#A8BBC0] block mb-1">Vinculado a:</span>
                    <span className="text-white text-xs block font-medium">
                      {selectedBlock.trackReferences[0].courseTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Outros Blocos Disponíveis */}
            <div className="rounded-xl border border-[#294149] bg-[#152228]/70 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-[#01B59A]" /> Blocos da Biblioteca (
                {blocks.length})
              </h3>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {blocks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBlock(b)}
                    className={`w-full text-left p-2 rounded text-xs transition-all ${
                      selectedBlock.id === b.id
                        ? 'bg-[#01B59A]/15 border border-[#01B59A] text-white font-medium'
                        : 'border border-transparent hover:bg-[#0C1317] text-[#A8BBC0] hover:text-white'
                    }`}
                  >
                    <p className="truncate text-xs">{b.title}</p>
                    <span className="text-[10px] font-mono text-[#01B59A] block mt-0.5">
                      {b.blockType}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
