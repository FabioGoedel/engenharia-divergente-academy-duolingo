import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Download,
  FileText,
  Boxes,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isAdminRole } from '@/lib/rbac'
import {
  ImportExportService,
  ValidationReport,
  ParsedImportItem,
  ImportExecutionResult,
  ImportHistoryRecord,
  IMPORT_LIMITS,
} from '@/services/importExportService'
import { DEMO_CANONICAL_PACKAGE } from '@/data/demoCanonicalPackage'
import { getBlockDefinition } from '@/components/cms/BlockRegistry'
import { ContentBlock, QuestionBankItem } from '@/types/cms'
import { SanitizedMarkdownViewer } from '@/components/cms/SanitizedMarkdownViewer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export const AdminImportPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role ? isAdminRole(user.role) : false
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados do fluxo de 10 passos
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [itemsList, setItemsList] = useState<ParsedImportItem[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportExecutionResult | null>(null)

  // Modais de Pré-visualização
  const [previewItem, setPreviewItem] = useState<ParsedImportItem | null>(null)

  // Histórico de Importações & Rollback
  const [history, setHistory] = useState<ImportHistoryRecord[]>(() =>
    ImportExportService.listImportHistory(),
  )
  const [isRollingBack, setIsRollingBack] = useState(false)

  // 1. Seleção de Arquivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processSelectedFile(file)
  }

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file)
    setIsAnalyzing(true)
    setCurrentStep(2) // 2. Analisar o conteúdo
    setImportResult(null)

    try {
      // 3. Validar estrutura / 4. Tipos incompatíveis / 5. IDs e versões / 6. Apresentar relatório
      const validationReport = await ImportExportService.analyzeAndValidateFile(file, user?.role)
      setReport(validationReport)
      setItemsList(validationReport.items)
      setCurrentStep(6) // Avança para o relatório de validação e seleção
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha na análise do arquivo',
        description: err instanceof Error ? err.message : 'Erro ao processar',
      })
      setCurrentStep(1)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Carrega pacote canônico de exemplo embutido
  const handleLoadSamplePackage = async () => {
    const sampleBlob = new Blob([JSON.stringify(DEMO_CANONICAL_PACKAGE, null, 2)], {
      type: 'application/json',
    })
    const sampleFile = new File([sampleBlob], 'pacote_canonio_mef_exemplo_v1.0.0.json', {
      type: 'application/json',
    })
    processSelectedFile(sampleFile)
  }

  // Baixa o JSON de exemplo para a máquina do usuário
  const handleDownloadSampleFile = () => {
    const blob = new Blob([JSON.stringify(DEMO_CANONICAL_PACKAGE, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ediv_pacote_exemplo_canonica_v1.0.0.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: 'Download iniciado',
      description: 'Pacote de exemplo pronto para testes e auditoria.',
    })
  }

  // Seleção e desseleção de itens válidos
  const handleToggleSelectItem = (key: string) => {
    setItemsList((prev) =>
      prev.map((it) => (it.key === key ? { ...it, selectedForImport: !it.selectedForImport } : it)),
    )
  }

  const handleSelectAllValid = () => {
    setItemsList((prev) =>
      prev.map((it) => ({
        ...it,
        selectedForImport: it.validationErrors.length === 0,
      })),
    )
  }

  const handleDeselectAll = () => {
    setItemsList((prev) => prev.map((it) => ({ ...it, selectedForImport: false })))
  }

  // 9. Confirmar a Importação
  const handleExecuteImport = async () => {
    if (!report) return
    const selected = itemsList.filter((it) => it.selectedForImport)
    if (selected.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum item selecionado',
        description: 'Selecione pelo menos um item válido para importar.',
      })
      return
    }

    setIsImporting(true)
    setCurrentStep(9)

    try {
      const result = await ImportExportService.executeImport(
        selected,
        report.fileName,
        user?.role,
        user?.name,
      )
      setImportResult(result)
      setHistory(ImportExportService.listImportHistory())
      setCurrentStep(10) // 10. Apresentar relatório final
      toast({
        title: 'Importação concluída com sucesso',
        description: `${result.importedBlocksCount} blocos e ${result.importedQuestionsCount} questões adicionados como rascunho.`,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro na execução da importação',
        description: err instanceof Error ? err.message : 'Falha ao gravar registros',
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Rollback de lote importado
  const handleRollback = async (batchId: string) => {
    setIsRollingBack(true)
    try {
      const res = await ImportExportService.rollbackImportBatch(batchId, user?.role, user?.name)
      if (res.success) {
        toast({ title: 'Rollback concluído', description: res.message })
        setHistory(ImportExportService.listImportHistory())
      } else {
        toast({ variant: 'destructive', title: 'Erro no rollback', description: res.message })
      }
    } finally {
      setIsRollingBack(false)
    }
  }

  const selectedCount = itemsList.filter((i) => i.selectedForImport).length

  return (
    <div className="space-y-6">
      {/* Topo Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Importação em Massa</h1>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              ediv-content-package v1.0.0
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Importe centenas de questões e blocos gerados externamente (ChatGPT, Claude, scripts)
            com validação Zod, idempotência e proteção estrita de gabaritos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadSampleFile}
            className="border-[#294149] text-white hover:border-[#01B59A] text-xs"
          >
            <Download className="h-4 w-4 mr-1.5 text-[#01B59A]" /> Baixar Pacote de Exemplo
          </Button>
          <Button
            onClick={handleLoadSamplePackage}
            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
          >
            <Sparkles className="h-4 w-4 mr-1.5" /> Testar Pacote de Exemplo
          </Button>
        </div>
      </div>

      {/* Alerta de Segurança e Modo Demo */}
      <div className="p-3.5 rounded-xl border border-[#01B59A]/30 bg-[#01B59A]/10 text-xs text-[#E6EAED] flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-[#01B59A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Garantias de Integridade & Proteção Pedagógica:
          </p>
          <p className="text-[#A8BBC0] leading-relaxed">
            Todo conteúdo importado entra obrigatoriamente no estado editorial{' '}
            <strong>Rascunho (draft)</strong> e passa por sanitização recursiva de scripts.
            Gabaritos protegidos (private_key) são preservados no servidor e reimportações de itens
            existentes com o mesmo ID preservam o histórico de versões (reimportação idempotente).
            Limite por lote: <strong>{IMPORT_LIMITS.MAX_ITEMS_PER_BATCH} itens</strong> /{' '}
            <strong>{IMPORT_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB</strong>.
          </p>
        </div>
      </div>

      {/* Indicador do Fluxo de 10 Passos */}
      <div className="p-4 rounded-xl border border-[#294149] bg-[#152228]/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-[#01B59A] uppercase tracking-wider font-bold">
            Fluxo Obrigatório de Importação: Passo {currentStep} de 10
          </span>
          <span className="text-[11px] text-[#A8BBC0]">
            {currentStep === 1 && '1. Selecionar arquivo'}
            {currentStep === 2 && '2. Analisar o conteúdo'}
            {currentStep === 3 && '3. Validar estrutura e campos'}
            {currentStep === 6 && '6. Apresentar relatório & 7. Pré-visualizar'}
            {currentStep === 8 && '8. Selecionar itens válidos'}
            {currentStep === 9 && '9. Confirmar importação em lote'}
            {currentStep === 10 && '10. Relatório final de execução'}
          </span>
        </div>
        <Progress value={(currentStep / 10) * 100} className="h-1.5 bg-[#0C1317]" />
      </div>

      {/* ETAPA 1 E 2: SELEÇÃO E UPLOAD DO ARQUIVO */}
      {currentStep < 6 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#294149] hover:border-[#01B59A]/80 transition-colors rounded-2xl p-10 text-center bg-[#152228]/40 space-y-4"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-[#0C1317] border border-[#294149] flex items-center justify-center text-[#01B59A]">
            <UploadCloud className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              Arraste e solte o arquivo do pacote de conteúdo
            </h3>
            <p className="text-xs text-[#A8BBC0]">
              Formatos aceitos: <strong>JSON individual</strong>,{' '}
              <strong>JSON com múltiplos blocos</strong> ou <strong>ZIP com manifesto JSON</strong>.
              Limite: 15 MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.zip"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs px-6"
            >
              {isAnalyzing ? 'Analisando Arquivo...' : 'Selecionar Arquivo do Computador'}
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadSamplePackage}
              className="border-[#294149] text-xs text-white hover:border-[#01B59A]"
            >
              Carregar Amostra (.json)
            </Button>
          </div>
        </div>
      )}

      {/* ETAPA 6 A 8: RELATÓRIO DE VALIDAÇÃO, PRÉ-VISUALIZAÇÃO E SELEÇÃO */}
      {report && currentStep >= 6 && currentStep < 10 && (
        <div className="space-y-5">
          {/* Card Resumo do Relatório */}
          <div className="p-4 rounded-xl border border-[#294149] bg-[#152228] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[#A8BBC0] block text-[10px]">Arquivo:</span>
              <span className="font-semibold text-white truncate block">{report.fileName}</span>
            </div>
            <div>
              <span className="text-[#A8BBC0] block text-[10px]">Formato:</span>
              <span className="font-mono text-[#01B59A]">{report.formatDetected}</span>
            </div>
            <div>
              <span className="text-[#A8BBC0] block text-[10px]">Total de Itens:</span>
              <span className="font-bold text-white text-sm">{report.totalItemsDetected}</span>
            </div>
            <div>
              <span className="text-[#A8BBC0] block text-[10px]">Válidos / Inválidos:</span>
              <span className="font-bold text-white">
                <span className="text-[#01B59A]">{report.validItemsCount}</span> /{' '}
                <span className="text-[#C86F63]">{report.invalidItemsCount}</span>
              </span>
            </div>
            <div>
              <span className="text-[#A8BBC0] block text-[10px]">Duplicatas / Incompatíveis:</span>
              <span className="font-bold text-white">
                <span className="text-[#C69B4B]">{report.duplicateCount}</span> /{' '}
                <span className="text-[#C86F63]">{report.incompatibleTypeCount}</span>
              </span>
            </div>
          </div>

          {/* Erros Globais */}
          {report.globalErrors.length > 0 && (
            <div className="p-3.5 rounded-lg border border-[#C86F63]/40 bg-[#C86F63]/10 text-xs text-[#C86F63] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4" /> Erros Críticos no Arquivo:
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {report.globalErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Barra de Ações de Seleção */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0C1317] p-3 rounded-lg border border-[#294149]">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-white font-medium">
                {selectedCount} de {itemsList.length} item(ns) selecionados para importar
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllValid}
                  className="text-[11px] text-[#01B59A] hover:underline"
                >
                  Selecionar todos os válidos
                </button>
                <span className="text-[#A8BBC0]">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] text-[#A8BBC0] hover:text-white"
                >
                  Desmarcar todos
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  setReport(null)
                  setCurrentStep(1)
                }}
                className="border-[#294149] text-xs text-white"
              >
                Voltar / Outro Arquivo
              </Button>
              <Button
                size="sm"
                disabled={selectedCount === 0 || isImporting}
                onClick={handleExecuteImport}
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs px-5"
              >
                {isImporting ? 'Importando Lote...' : `Confirmar Importação (${selectedCount})`}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Tabela de Itens Analisados (com Pré-visualização individual) */}
          <div className="border border-[#294149] rounded-xl overflow-hidden bg-[#152228]/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C1317] text-[#A8BBC0] border-b border-[#294149] text-[10px] uppercase font-mono">
                  <tr>
                    <th className="p-3 w-10 text-center">Sel.</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tipo / Categoria</th>
                    <th className="p-3">ID / Título</th>
                    <th className="p-3">Versão / Idempotência</th>
                    <th className="p-3">Diagnóstico</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#294149]/50 text-white">
                  {itemsList.map((item) => {
                    const isValid = item.validationErrors.length === 0

                    return (
                      <tr
                        key={item.key}
                        className={`hover:bg-[#152228] transition-colors ${
                          !isValid ? 'opacity-80 bg-red-950/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selectedForImport}
                            disabled={!isValid}
                            onChange={() => handleToggleSelectItem(item.key)}
                            className="rounded accent-[#01B59A] cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          {isValid ? (
                            <Badge className="bg-[#01B59A]/20 text-[#01B59A] border border-[#01B59A]/40 text-[9px] uppercase font-mono">
                              Válido
                            </Badge>
                          ) : (
                            <Badge className="bg-[#C86F63]/20 text-[#C86F63] border border-[#C86F63]/40 text-[9px] uppercase font-mono">
                              Inválido
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <span className="text-[#01B59A]">{item.typeOrKind}</span>
                          <span className="text-[#A8BBC0] text-[10px] block">
                            {item.itemType === 'block' ? 'Bloco CMS' : 'Questão'}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-xs truncate max-w-[240px]">
                            {item.title}
                          </p>
                          <span className="font-mono text-[10px] text-[#A8BBC0]">{item.id}</span>
                        </td>
                        <td className="p-3 text-[11px] font-mono">
                          {item.isDuplicateId ? (
                            <span className="text-[#C69B4B] flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" />
                              Atualiza v{item.existingVersion} → v{item.cleanPayload.version}
                            </span>
                          ) : (
                            <span className="text-[#A8BBC0]">Novo (v{item.version})</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px]">
                          {item.validationErrors.length > 0 ? (
                            <p className="text-[#C86F63] line-clamp-2">
                              {item.validationErrors.join('; ')}
                            </p>
                          ) : (
                            <span className="text-[#01B59A] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Estrutura íntegra
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewItem(item)}
                            className="h-7 text-xs text-white hover:text-[#01B59A]"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Pré-visualizar
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 10: RELATÓRIO FINAL DE IMPORTAÇÃO */}
      {importResult && currentStep === 10 && (
        <div className="p-6 rounded-2xl border border-[#01B59A]/50 bg-[#152228] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#01B59A]/20 flex items-center justify-center text-[#01B59A]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Importação Concluída com Sucesso!</h2>
              <p className="text-xs text-[#A8BBC0]">
                Lote {importResult.batchId} persistido em modo demonstração (
                {importResult.timestamp})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149]">
              <span className="text-[#A8BBC0] block">Blocos Importados:</span>
              <span className="text-xl font-bold text-[#01B59A]">
                {importResult.importedBlocksCount}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149]">
              <span className="text-[#A8BBC0] block">Questões Importadas:</span>
              <span className="text-xl font-bold text-[#01B59A]">
                {importResult.importedQuestionsCount}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149]">
              <span className="text-[#A8BBC0] block">Itens Ignorados:</span>
              <span className="text-xl font-bold text-[#A8BBC0]">{importResult.skippedCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149]">
              <span className="text-[#A8BBC0] block">Falhas:</span>
              <span className="text-xl font-bold text-[#C86F63]">{importResult.failedCount}</span>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="p-3 rounded-lg border border-[#C86F63]/30 bg-[#C86F63]/10 text-xs text-[#C86F63] space-y-1">
              <span className="font-bold">Ocorrências registradas:</span>
              {importResult.errors.map((e, idx) => (
                <p key={idx}>
                  Item {e.id}: {e.error}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => {
                setSelectedFile(null)
                setReport(null)
                setImportResult(null)
                setCurrentStep(1)
              }}
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
            >
              Fazer Nova Importação
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/admin/blocos')}
              className="border-[#294149] text-white text-xs"
            >
              Ver na Biblioteca de Blocos
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/admin/questoes')}
              className="border-[#294149] text-white text-xs"
            >
              Ver no Banco de Questões
            </Button>
          </div>
        </div>
      )}

      {/* SEÇÃO DE HISTÓRICO DE IMPORTAÇÕES E ROLLBACK */}
      <div className="space-y-3 pt-4 border-t border-[#294149]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#01B59A]" />
            Histórico de Lotes & Rollback de Segurança
          </h3>
          <span className="text-[11px] text-[#A8BBC0]">
            Permite reverter importações indesejadas preservando conteúdos já publicados
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#A8BBC0] italic py-2">
            Nenhum lote importado ainda nesta sessão.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-3 rounded-lg border border-[#294149] bg-[#152228]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#01B59A] font-bold">
                      {record.id}
                    </span>
                    <span className="text-white font-medium">{record.fileName}</span>
                    {record.rolledBack && (
                      <Badge className="bg-zinc-800 text-zinc-400 text-[9px] uppercase font-mono">
                        Revertido
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A8BBC0]">
                    Importado em {new Date(record.importedAt).toLocaleString('pt-BR')} por{' '}
                    {record.importedBy} • {record.importedBlockIds.length} blocos,{' '}
                    {record.importedQuestionIds.length} questões
                  </p>
                </div>

                {!record.rolledBack && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isRollingBack}
                    onClick={() => handleRollback(record.id)}
                    className="border-[#C86F63]/50 text-[#C86F63] hover:bg-[#C86F63]/10 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Reverter este Lote
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO (PASSO 7) */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <span className="font-mono text-[#01B59A]">{previewItem?.typeOrKind}</span>
              <span>— {previewItem?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {previewItem && (
            <div className="space-y-4 text-xs">
              {/* Alerta caso inválido */}
              {previewItem.validationErrors.length > 0 && (
                <div className="p-3 rounded-lg border border-[#C86F63]/40 bg-[#C86F63]/10 text-[#C86F63] space-y-1">
                  <span className="font-bold">Inconsistências detectadas:</span>
                  <ul className="list-disc list-inside">
                    {previewItem.validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Renderização real do item como aluno */}
              <div className="p-4 rounded-xl border border-[#294149] bg-[#152228] space-y-3">
                <span className="font-mono text-[10px] uppercase text-[#A8BBC0] block">
                  Renderização Visual no Motor de Atividades:
                </span>

                {previewItem.itemType === 'block' &&
                  (() => {
                    const block = previewItem.cleanPayload as ContentBlock
                    const def = getBlockDefinition(block.blockType)
                    if (!def)
                      return <p className="text-xs text-[#C86F63]">Renderer não cadastrado.</p>
                    const StudentComp = def.StudentComponent
                    return <StudentComp config={block.config} />
                  })()}

                {previewItem.itemType === 'question' &&
                  (() => {
                    const q = previewItem.cleanPayload as QuestionBankItem
                    return (
                      <div className="space-y-3">
                        <div className="p-2.5 rounded border border-[#294149] bg-[#0C1317]">
                          <SanitizedMarkdownViewer content={q.promptMarkdown} />
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1.5">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="p-2 rounded border border-[#294149] bg-[#152228]/50 flex items-center gap-2"
                              >
                                <span className="font-mono font-bold text-[#01B59A]">
                                  {opt.label})
                                </span>
                                <span>{opt.textMarkdown}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
              </div>

              {/* Inspecção JSON do Payload Bruto */}
              <div className="p-3 rounded-lg border border-[#294149] bg-[#0C1317] space-y-1.5">
                <span className="font-mono text-[10px] uppercase text-[#A8BBC0]">
                  JSON Estruturado (Validado e Sanitizado):
                </span>
                <pre className="font-mono text-[11px] text-[#A8BBC0] bg-black/40 p-2 rounded overflow-x-auto max-h-48">
                  {JSON.stringify(previewItem.cleanPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewItem(null)}
              className="text-xs border-[#294149]"
            >
              Fechar Visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
