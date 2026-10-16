export type VideoProviderType =
  | 'youtube'
  | 'vimeo'
  | 'cloudflare_stream'
  | 'external_url'
  | 'supabase_storage'

export interface VideoMetadata {
  provider: VideoProviderType
  videoId: string
  title: string
  embedUrl: string
  thumbnailUrl?: string
  isProtected: boolean
  requiresDomainLock: boolean
  playbackTokensSupported: boolean
}

export interface VideoProviderAdapter {
  provider: VideoProviderType
  canHandle(urlOrId: string): boolean
  parseIdentifier(urlOrId: string): string
  getEmbedUrl(videoId: string, options?: { autoplay?: boolean; startSeconds?: number }): string
  getThumbnailUrl(videoId: string): string
  isProtectedProvider(): boolean
}

/**
 * Adaptador YouTube
 */
export const YouTubeAdapter: VideoProviderAdapter = {
  provider: 'youtube',
  canHandle(urlOrId: string): boolean {
    return (
      urlOrId.includes('youtube.com') ||
      urlOrId.includes('youtu.be') ||
      /^[a-zA-Z0-9_-]{11}$/.test(urlOrId)
    )
  },
  parseIdentifier(urlOrId: string): string {
    const raw = urlOrId.trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

    try {
      const url = new URL(raw)
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.slice(1).split('?')[0]
      }
      const v = url.searchParams.get('v')
      if (v) return v
      const embedParts = url.pathname.split('/embed/')
      if (embedParts.length > 1) return embedParts[1].split('?')[0]
    } catch {
      // segue
    }
    return raw
  },
  getEmbedUrl(videoId: string, options?: { autoplay?: boolean; startSeconds?: number }): string {
    const params = new URLSearchParams()
    params.set('rel', '0')
    params.set('modestbranding', '1')
    if (options?.autoplay) params.set('autoplay', '1')
    if (options?.startSeconds) params.set('start', String(options.startSeconds))
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
  },
  getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  },
  isProtectedProvider(): boolean {
    return false // YouTube é aberto / unlisted, não possui DRM forte
  },
}

/**
 * Adaptador Vimeo
 */
export const VimeoAdapter: VideoProviderAdapter = {
  provider: 'vimeo',
  canHandle(urlOrId: string): boolean {
    return urlOrId.includes('vimeo.com') || /^\d{6,12}$/.test(urlOrId.trim())
  },
  parseIdentifier(urlOrId: string): string {
    const raw = urlOrId.trim()
    if (/^\d{6,12}$/.test(raw)) return raw
    try {
      const url = new URL(raw)
      const parts = url.pathname.split('/').filter(Boolean)
      const last = parts[parts.length - 1]
      if (/^\d+$/.test(last)) return last
    } catch {
      // segue
    }
    return raw
  },
  getEmbedUrl(videoId: string, options?: { autoplay?: boolean }): string {
    const params = new URLSearchParams()
    params.set('dnt', '1')
    if (options?.autoplay) params.set('autoplay', '1')
    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
  },
  getThumbnailUrl(videoId: string): string {
    return `https://vumbnail.com/${videoId}.jpg`
  },
  isProtectedProvider(): boolean {
    return true // Suporta restrição de domínio corporativo
  },
}

/**
 * Adaptador Cloudflare Stream / Provedor Pago
 */
export const CloudflareStreamAdapter: VideoProviderAdapter = {
  provider: 'cloudflare_stream',
  canHandle(urlOrId: string): boolean {
    return urlOrId.includes('cloudflarestream.com') || urlOrId.includes('videodelivery.net')
  },
  parseIdentifier(urlOrId: string): string {
    try {
      const url = new URL(urlOrId)
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[0] || urlOrId
    } catch {
      return urlOrId.trim()
    }
  },
  getEmbedUrl(videoId: string): string {
    return `https://iframe.videodelivery.net/${videoId}`
  },
  getThumbnailUrl(videoId: string): string {
    return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`
  },
  isProtectedProvider(): boolean {
    return true // Suporta Signed URLs & tokens com rotação horária
  },
}

/**
 * Adaptador Supabase Storage / MP4 Próprio
 */
export const SupabaseVideoAdapter: VideoProviderAdapter = {
  provider: 'supabase_storage',
  canHandle(urlOrId: string): boolean {
    return urlOrId.includes('/storage/v1/') || urlOrId.endsWith('.mp4') || urlOrId.endsWith('.webm')
  },
  parseIdentifier(urlOrId: string): string {
    return urlOrId.trim()
  },
  getEmbedUrl(videoId: string): string {
    return videoId
  },
  getThumbnailUrl(_videoId: string): string {
    return 'https://img.usecurling.com/p/640/360?q=engineering%20video%20lecture'
  },
  isProtectedProvider(): boolean {
    return true
  },
}

/**
 * Gerenciador Unificado de Provedores
 */
const ADAPTERS: VideoProviderAdapter[] = [
  YouTubeAdapter,
  VimeoAdapter,
  CloudflareStreamAdapter,
  SupabaseVideoAdapter,
]

export function resolveVideoAdapter(providerOrUrl: string): VideoProviderAdapter {
  const matched = ADAPTERS.find((a) => a.provider === providerOrUrl || a.canHandle(providerOrUrl))
  return matched || YouTubeAdapter
}
