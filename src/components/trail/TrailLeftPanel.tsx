import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAllNodeTypes } from './nodeTypesRegistry'
import { TrailNodeType } from '@/types/trailGraph'
import { ContentBlock } from '@/types/cms'
import { Search, Plus, Layers, Boxes, Sparkles } from 'lucide-react'

interface TrailLeftPanelProps {
  availableBlocks: ContentBlock[]
  onAddNode: (type: TrailNodeType, block?: ContentBlock) => void
}

export const TrailLeftPanel: React.FC<TrailLeftPanelProps> = ({ availableBlocks, onAddNode }) => {
  const [activeTab, setActiveTab] = useState<'node_types' | 'library_blocks'>('node_types')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const nodeTypes = getAllNodeTypes()

  const filteredBlocks = availableBlocks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.blockType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.subjectArea && b.subjectArea.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex h-full w-80 flex-col border-r border-[#294149] bg-[#0C1317] text-[#E6EAED]">
      {/* Topo do painel */}
      <div className="border-b border-[#294149] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#01B59A] font-mono">
            Biblioteca de Componentes
          </span>
          <Badge variant="outline" className="text-[10px] border-[#294149] text-[#A8BBC0]">
            Fase 3
          </Badge>
        </div>

        {/* Alternância de Abas */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#152228] p-1 text-xs">
          <button
            onClick={() => setActiveTab('node_types')}
            className={`flex items-center justify-center gap-1.5 rounded py-1 font-medium transition-colors ${
              activeTab === 'node_types'
                ? 'bg-[#01B59A] text-black font-semibold shadow-sm'
                : 'text-[#A8BBC0] hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>9 Tipos de Nós</span>
          </button>
          <button
            onClick={() => setActiveTab('library_blocks')}
            className={`flex items-center justify-center gap-1.5 rounded py-1 font-medium transition-colors ${
              activeTab === 'library_blocks'
                ? 'bg-[#01B59A] text-black font-semibold shadow-sm'
                : 'text-[#A8BBC0] hover:text-white'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Blocos ({availableBlocks.length})</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba 1: 9 Tipos Canônicos de Nós */}
      {activeTab === 'node_types' && (
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            <p className="text-[11px] text-[#A8BBC0] mb-2 leading-tight">
              Clique em "+ Adicionar" ou arraste para o canvas para criar uma nova etapa da trilha.
            </p>
            {nodeTypes.map((typeDef) => {
              const Icon = typeDef.icon
              return (
                <div
                  key={typeDef.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/ediv-node-type', typeDef.type)
                  }}
                  className="group relative rounded-lg border border-[#294149] bg-[#152228]/50 p-2.5 transition-all hover:border-[#01B59A]/60 hover:bg-[#152228] cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
                        style={{ backgroundColor: typeDef.bgHex, color: typeDef.colorHex }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#01B59A] transition-colors">
                          {typeDef.title}
                        </h4>
                        <span className="text-[10px] text-[#A8BBC0] font-mono">
                          {typeDef.defaultMinutes}m • +{typeDef.defaultXp} XP
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAddNode(typeDef.type)}
                      className="h-7 w-7 p-0 text-[#A8BBC0] hover:bg-[#01B59A] hover:text-black shrink-0"
                      title="Adicionar nó ao canvas"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-1 text-[10px] text-[#A8BBC0]/80 line-clamp-2 leading-relaxed">
                    {typeDef.description}
                  </p>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Conteúdo da Aba 2: Reutilizar Blocos da Biblioteca */}
      {activeTab === 'library_blocks' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Busca e Filtros */}
          <div className="border-b border-[#294149] p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A8BBC0]" />
              <Input
                placeholder="Buscar blocos por nome ou tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-[#152228] border-[#294149] text-white"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {['all', 'assessment', 'media', 'interaction'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded px-2 py-0.5 capitalize whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#01B59A] text-black font-semibold'
                      : 'bg-[#152228] text-[#A8BBC0] hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {filteredBlocks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A8BBC0]">
                  Nenhum bloco encontrado com estes filtros.
                </div>
              ) : (
                filteredBlocks.map((blk) => (
                  <div
                    key={blk.id}
                    className="rounded-lg border border-[#294149] bg-[#152228]/40 p-2.5 transition-all hover:border-[#01B59A]/60 hover:bg-[#152228]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] border-[#294149] text-[#01B59A] px-1 py-0 font-mono"
                          >
                            {blk.blockType}
                          </Badge>
                          <span className="text-[10px] text-[#A8BBC0] font-mono">
                            v{blk.version}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{blk.title}</h4>
                        <p className="text-[10px] text-[#A8BBC0] line-clamp-1">{blk.description}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Mapeia o tipo de nó correspondente
                          let nodeType: TrailNodeType = 'learning_content'
                          if (blk.category === 'assessment') nodeType = 'single_question'
                          if (blk.blockType === 'checklist') nodeType = 'multimaterial_content'
                          onAddNode(nodeType, blk)
                        }}
                        className="h-7 w-7 p-0 text-[#A8BBC0] hover:bg-[#01B59A] hover:text-black shrink-0"
                        title="Reutilizar este bloco na trilha"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
