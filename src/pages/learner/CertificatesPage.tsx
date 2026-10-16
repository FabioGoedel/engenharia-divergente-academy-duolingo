import React, { useState } from 'react'
import {
  Award,
  Download,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CERTIFICATES, CertificateItem } from '@/data/demoData'
import { Wordmark } from '@/components/Wordmark'
import { useToast } from '@/hooks/use-toast'

export default function CertificatesPage() {
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { toast } = useToast()

  const handleOpenCertificate = (cert: CertificateItem) => {
    setSelectedCert(cert)
    setModalOpen(true)
  }

  const handleDownloadDemoPdf = () => {
    toast({
      title: 'Emissão de PDF (Demonstração)',
      description:
        'O layout oficial do certificado de conclusão com autenticação digital será emitido após a conclusão de todos os requisitos da trilha.',
    })
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <Award className="h-4 w-4" />
          <span>Certificações Técnicas & Habilitações</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Certificados Emitidos
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Documentos comprobatórios de conclusão de carga horária e proficiência em engenharia.
        </p>
      </div>

      {/* Grade de Certificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CERTIFICATES.map((cert) => (
          <Card
            key={cert.id}
            className={`bg-card border-border flex flex-col justify-between transition-all ${
              cert.isEarned ? 'hover:border-primary/50' : 'opacity-60 border-dashed'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px] text-muted-foreground">
                  {cert.workloadHours} Horas Atestadas
                </span>
                {cert.isEarned ? (
                  <Badge className="bg-[#1D957A]/15 text-[#1D957A] border-[#1D957A]/30 text-[10px] uppercase font-mono">
                    Concluído & Emitido
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-mono border-border text-muted-foreground"
                  >
                    Requisitos Pendentes
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                {cert.courseTitle}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <p>
                  Código de Registro: <strong className="text-foreground">{cert.code}</strong>
                </p>
                {cert.issueDate ? (
                  <p>
                    Data de Emissão: <strong className="text-foreground">{cert.issueDate}</strong>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Aguardando 100% de conclusão da trilha</p>
                )}
                {cert.gradeScore && (
                  <p>
                    Nota Média Final:{' '}
                    <strong className="text-primary">{cert.gradeScore.toFixed(1)} / 10.0</strong>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Instrutor(a): {cert.instructor}
                </span>

                {cert.isEarned ? (
                  <Button
                    size="sm"
                    onClick={() => handleOpenCertificate(cert)}
                    className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-8"
                  >
                    Visualizar Certificado
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="text-xs h-8 opacity-60">
                    <Lock className="h-3 w-3 mr-1" />
                    Bloqueado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Visual do Certificado */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-[#E6EAED] p-6 sm:p-8">
          <DialogHeader className="sr-only">
            <DialogTitle>Certificado de Conclusão</DialogTitle>
            <DialogDescription>Visualização prévia do certificado do aluno</DialogDescription>
          </DialogHeader>

          {selectedCert && (
            <div className="space-y-6">
              {/* Moldura do Certificado Técnico */}
              <div className="p-6 md:p-8 border-2 border-[#01B59A]/40 rounded-xl bg-[#152228] relative text-center space-y-4">
                <div className="flex justify-center mb-2">
                  <Wordmark size="md" to="" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#01B59A]">
                    Certificado de Aproveitamento Técnico
                  </span>
                  <h3 className="text-lg md:text-xl font-extrabold text-white">
                    Engenharia Divergente Academy
                  </h3>
                </div>

                <p className="text-xs text-[#A8BBC0] leading-relaxed max-w-lg mx-auto">
                  Certificamos que o(a) engenheiro(a){' '}
                  <strong className="text-white underline decoration-[#01B59A]">
                    {selectedCert.studentName}
                  </strong>{' '}
                  concluiu com êxito o programa curricular avançado da formação:
                </p>

                <div className="py-2 px-4 rounded bg-[#0C1317] border border-[#294149] inline-block">
                  <p className="font-bold text-sm text-[#01B59A]">{selectedCert.courseTitle}</p>
                </div>

                <p className="text-[11px] text-[#A8BBC0]">
                  Carga horária total de <strong>{selectedCert.workloadHours} horas</strong> com
                  aproveitamento de{' '}
                  <strong className="text-white">{selectedCert.gradeScore} / 10.0</strong>.
                </p>

                <div className="pt-4 border-t border-[#294149] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#A8BBC0] font-mono gap-2">
                  <span>Registro: {selectedCert.code}</span>
                  <span>Instrutor(a): {selectedCert.instructor}</span>
                  <span>Data: {selectedCert.issueDate}</span>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="border-[#294149] text-xs w-full sm:w-auto"
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadDemoPdf}
                  className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs w-full sm:w-auto flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar PDF (Demonstração)</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
