import { MediaAssetType } from '@/types/cms'

export interface FileClassification {
  assetType: MediaAssetType
  category: 'videos' | 'documents' | 'images' | 'cad' | 'spreadsheets' | 'archives' | 'exercises'
  isEngineeringCad: boolean
  label: string
  mimeType: string
}

const EXTENSION_MAP: Record<string, FileClassification> = {
  // CAD / Engenharia
  step: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Modelo STEP (ISO 10303)',
    mimeType: 'model/step',
  },
  stp: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Modelo STEP (ISO 10303)',
    mimeType: 'model/step',
  },
  iges: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Geometria IGES (ANSI)',
    mimeType: 'model/iges',
  },
  igs: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Geometria IGES (ANSI)',
    mimeType: 'model/iges',
  },
  stl: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Malha STL (Estereolitografia)',
    mimeType: 'model/stl',
  },
  dxf: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Desenho DXF (AutoCAD)',
    mimeType: 'image/vnd.dxf',
  },
  sldprt: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Peça SOLIDWORKS (.SLDPRT)',
    mimeType: 'application/x-solidworks-part',
  },
  sldasm: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Montagem SOLIDWORKS (.SLDASM)',
    mimeType: 'application/x-solidworks-assembly',
  },
  slddrw: {
    assetType: 'cad_model',
    category: 'cad',
    isEngineeringCad: true,
    label: 'Detalhamento SOLIDWORKS (.SLDDRW)',
    mimeType: 'application/x-solidworks-drawing',
  },

  // Documentos
  pdf: {
    assetType: 'pdf_document',
    category: 'documents',
    isEngineeringCad: false,
    label: 'Documento PDF',
    mimeType: 'application/pdf',
  },
  docx: {
    assetType: 'exercise_file',
    category: 'documents',
    isEngineeringCad: false,
    label: 'Documento Word (.docx)',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  txt: {
    assetType: 'exercise_file',
    category: 'documents',
    isEngineeringCad: false,
    label: 'Arquivo de Texto (.txt)',
    mimeType: 'text/plain',
  },

  // Planilhas
  xlsx: {
    assetType: 'spreadsheet',
    category: 'spreadsheets',
    isEngineeringCad: false,
    label: 'Planilha Excel (.xlsx)',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  xls: {
    assetType: 'spreadsheet',
    category: 'spreadsheets',
    isEngineeringCad: false,
    label: 'Planilha Excel (.xls)',
    mimeType: 'application/vnd.ms-excel',
  },
  csv: {
    assetType: 'spreadsheet',
    category: 'spreadsheets',
    isEngineeringCad: false,
    label: 'Planilha CSV',
    mimeType: 'text/csv',
  },

  // Imagens
  png: {
    assetType: 'image',
    category: 'images',
    isEngineeringCad: false,
    label: 'Imagem PNG',
    mimeType: 'image/png',
  },
  jpg: {
    assetType: 'image',
    category: 'images',
    isEngineeringCad: false,
    label: 'Imagem JPEG',
    mimeType: 'image/jpeg',
  },
  jpeg: {
    assetType: 'image',
    category: 'images',
    isEngineeringCad: false,
    label: 'Imagem JPEG',
    mimeType: 'image/jpeg',
  },
  webp: {
    assetType: 'image',
    category: 'images',
    isEngineeringCad: false,
    label: 'Imagem WebP',
    mimeType: 'image/webp',
  },
  svg: {
    assetType: 'image',
    category: 'images',
    isEngineeringCad: false,
    label: 'Vetor SVG',
    mimeType: 'image/svg+xml',
  },

  // Compactados
  zip: {
    assetType: 'archive',
    category: 'archives',
    isEngineeringCad: false,
    label: 'Pacote Compactado ZIP',
    mimeType: 'application/zip',
  },
}

// Extensões perigosas bloqueadas para upload
const BLOCKED_EXTENSIONS = new Set([
  'exe',
  'bat',
  'sh',
  'cmd',
  'msi',
  'vbs',
  'ps1',
  'scr',
  'jar',
  'jsp',
  'php',
  'py',
  'rb',
  'cgi',
  'dll',
  'so',
  'com',
])

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  return parts.pop()!.toLowerCase().trim()
}

export function classifyFile(filename: string, mimeType?: string): FileClassification {
  const ext = getFileExtension(filename)
  if (EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext]
  }

  // Fallback por MIME
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      return {
        assetType: 'image',
        category: 'images',
        isEngineeringCad: false,
        label: 'Imagem',
        mimeType,
      }
    }
    if (mimeType.includes('pdf')) {
      return {
        assetType: 'pdf_document',
        category: 'documents',
        isEngineeringCad: false,
        label: 'PDF',
        mimeType,
      }
    }
  }

  return {
    assetType: 'exercise_file',
    category: 'documents',
    isEngineeringCad: false,
    label: ext ? `Arquivo .${ext.toUpperCase()}` : 'Arquivo genérico',
    mimeType: mimeType || 'application/octet-stream',
  }
}

export function validateSafeFileName(filename: string): { valid: boolean; reason?: string } {
  // Previne path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      valid: false,
      reason: 'Nome de arquivo inválido: caracteres de navegação de diretório não permitidos.',
    }
  }

  const ext = getFileExtension(filename)
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      reason: `Arquivos executáveis ou scripts (.${ext}) são estritamente proibidos por segurança.`,
    }
  }

  if (filename.length > 255) {
    return {
      valid: false,
      reason: 'Nome de arquivo excede o limite máximo de 255 caracteres.',
    }
  }

  return { valid: true }
}

export async function calculateFileSha256(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
