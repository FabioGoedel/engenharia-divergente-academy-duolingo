import React, { useState } from 'react'
import { Play, Shield, Lock, ExternalLink, RefreshCw } from 'lucide-react'
import { resolveVideoAdapter } from '@/services/videoProviderAdapter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UniversalVideoPlayerProps {
  title: string
  urlOrId: string
  provider?: string
  thumbnailUrl?: string
  durationSeconds?: number
  isLocked?: boolean
  lockedReason?: string
  onUnlockClick?: () => void
  onProgress?: (progressPercent: number) => void
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  title,
  urlOrId,
  provider,
  thumbnailUrl,
  durationSeconds,
  isLocked = false,
  lockedReason,
  onUnlockClick,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)

  const adapter = resolveVideoAdapter(provider || urlOrId)
  const videoId = adapter.parseIdentifier(urlOrId)
  const embedUrl = adapter.getEmbedUrl(videoId, { autoplay: true })
  const finalThumbnail =
    thumbnailUrl ||
    adapter.getThumbnailUrl(videoId) ||
    'https://img.usecurling.com/p/640/360?q=engineering%20course%20video'

  if (isLocked) {
    return (
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#0C1317] border border-[#294149] flex flex-col items-center justify-center p-6 text-center text-white my-3">
        <div className="absolute inset-0 opacity-20 filter blur-sm">
          <img src={finalThumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 space-y-3 max-w-md">
          <div className="h-12 w-12 rounded-full bg-[#152228] border border-[#C69B4B]/50 flex items-center justify-center mx-auto text-[#C69B4B]">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-[#A8BBC0]">
            {lockedReason ||
              'Este conteúdo em vídeo é exclusivo para alunos matriculados neste curso ou assinantes autorizados.'}
          </p>
          {onUnlockClick && (
            <Button
              onClick={onUnlockClick}
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs mt-2"
            >
              Ver Opções de Matrícula
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#294149] bg-[#0C1317] overflow-hidden my-3 shadow-lg">
      <div className="relative aspect-video w-full bg-black">
        {isPlaying ? (
          adapter.provider === 'supabase_storage' ? (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              controlsList="nodownload"
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )
        ) : (
          <div
            className="relative w-full h-full group cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <img src={finalThumbnail} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-[#01B59A] group-hover:scale-110 transition-transform flex items-center justify-center text-black shadow-xl">
                <Play className="h-7 w-7 ml-1 fill-current" />
              </div>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-[#0C1317]/90 text-white border-white/20 text-[10px] uppercase font-mono"
              >
                {adapter.provider}
              </Badge>
              {adapter.isProtectedProvider() && (
                <Badge className="bg-[#01B59A] text-black text-[9px] font-mono font-bold flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" /> Protegido
                </Badge>
              )}
            </div>
            {durationSeconds ? (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono text-white">
                {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="p-3 bg-[#152228] border-t border-[#294149] flex items-center justify-between text-xs">
        <div>
          <h4 className="font-semibold text-white truncate">{title}</h4>
          <p className="text-[11px] text-[#A8BBC0] flex items-center gap-1 mt-0.5">
            <span>Provedor: {adapter.provider}</span>
            {adapter.isProtectedProvider() && <span>• Restrição por Domínio & Token Ativa</span>}
          </p>
        </div>
        {isPlaying && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsPlaying(false)}
            className="h-7 text-xs text-[#A8BBC0] hover:text-white"
          >
            Fechar player
          </Button>
        )}
      </div>
    </div>
  )
}
