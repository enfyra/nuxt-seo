import type { OgImageConfig } from '../../../types'

export type OgImageFormat = 'webp' | 'jpeg' | 'png'

export interface OgImageRequest {
  path: string
  origin: string
  facebook: boolean
  config: OgImageConfig
}

export interface OgImageEntry {
  buffer: Buffer
  generatedAt: number
}

export interface OgImageResult extends OgImageEntry {
  stale: boolean
}
