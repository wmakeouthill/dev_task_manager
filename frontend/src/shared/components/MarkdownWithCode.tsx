import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypePrism from 'rehype-prism-plus'

interface MarkdownWithCodeProps {
  readonly children: string
}

export function MarkdownWithCode({ children }: MarkdownWithCodeProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
    >
      {children}
    </ReactMarkdown>
  )
}
