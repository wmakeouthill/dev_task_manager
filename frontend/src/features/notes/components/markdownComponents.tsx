import { useState, useRef, useCallback } from 'react'
import './markdownComponents.css'

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [getText])

  return (
    <button
      type="button"
      className="md-copy-btn"
      onClick={handleCopy}
      title={copied ? 'Copiado!' : 'Copiar'}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

function CodeBlock({ children, ...props }: any) {
  const preRef = useRef<HTMLPreElement>(null)
  const codeEl = Array.isArray(children) ? children[0] : children
  const lang = (codeEl?.props?.className || '').replace('language-', '')

  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{lang || 'text'}</span>
        <CopyButton getText={() => preRef.current?.textContent || ''} />
      </div>
      <pre ref={preRef} {...props}>{children}</pre>
    </div>
  )
}

function QuoteBlock({ children, ...props }: any) {
  const ref = useRef<HTMLQuoteElement>(null)

  return (
    <blockquote ref={ref} className="md-blockquote" {...props}>
      {children}
      <CopyButton getText={() => ref.current?.textContent || ''} />
    </blockquote>
  )
}

export const markdownComponents = {
  pre: CodeBlock,
  blockquote: QuoteBlock,
}
