export interface ComponentInfo {
  id: string
  name: string
  description: string
  category: string
  component: React.ComponentType<Record<string, unknown>>
  code: string
  preview?: string
}

export interface CategoryInfo {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  count: number
}

export type ViewportSize = 'desktop' | 'tablet' | 'mobile'

export interface PreviewSettings {
  viewport: ViewportSize
  theme: 'light' | 'dark' | 'system'
  showCode: boolean
}
