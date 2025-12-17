'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { logger } from '@/lib/logger'

interface CodeDisplayProps {
  code: string
  language?: string
}

export function CodeDisplay({ code, language = 'tsx' }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logger.error('Failed to copy code to clipboard', err as Error, {
        category: 'ui',
        component: 'CodeDisplay',
        operation: 'copyToClipboard',
        codeLength: code.length,
        language,
      })
    }
  }

  return (
    <div className="relative border-t bg-muted/50">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-2">
        <span className="font-medium text-muted-foreground text-sm">
          {language.toUpperCase()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <ScrollArea className="h-96">
        <pre className="p-4 text-sm">
          <code className="text-foreground">{code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}
