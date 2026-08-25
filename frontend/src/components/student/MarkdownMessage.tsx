'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/components/ui';

/**
 * Renders an AI tutor answer written in Markdown (+ LaTeX math) as real,
 * theme-aware HTML. Previously the raw string was dumped with
 * `whitespace-pre-wrap`, so students saw literal "###", "**", "$$" and
 * blockquote ">" characters. This turns those into headings, bold text,
 * lists, tables, quoted textbook passages and rendered formulae.
 *
 * `inverted` styles the content for a dark/primary bubble (user messages).
 */
export const MarkdownMessage: React.FC<{ content: string; inverted?: boolean; className?: string }> = ({
  content,
  inverted = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'eduos-md text-meta leading-relaxed break-words',
        inverted && 'eduos-md--inverted',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          h1: ({ children }) => <h3 className="mt-3 mb-1.5 text-body font-bold first:mt-0">{children}</h3>,
          h2: ({ children }) => <h4 className="mt-3 mb-1.5 text-body font-bold first:mt-0">{children}</h4>,
          h3: ({ children }) => <h4 className="mt-2.5 mb-1 text-meta font-bold first:mt-0">{children}</h4>,
          h4: ({ children }) => <h5 className="mt-2 mb-1 text-meta font-semibold first:mt-0">{children}</h5>,
          p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic opacity-90">{children}</em>,
          ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-1 marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal space-y-1 marker:font-semibold marker:text-primary">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                'my-2 rounded-r-md border-l-4 py-1.5 pl-3 pr-2 text-meta italic',
                inverted
                  ? 'border-white/50 bg-white/10'
                  : 'border-primary/40 bg-primary-soft/40 text-text-secondary',
              )}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('font-semibold underline underline-offset-2', inverted ? 'text-white' : 'text-primary hover:text-primary-hover')}
            >
              {children}
            </a>
          ),
          code: ({ className: cls, children }) => {
            const isBlock = (cls || '').includes('language-');
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-surface-muted p-3 font-mono text-micro text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  'rounded px-1 py-0.5 font-mono text-[0.85em]',
                  inverted ? 'bg-white/20' : 'bg-surface-muted text-primary',
                )}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
          hr: () => <hr className={cn('my-3 border-t', inverted ? 'border-white/25' : 'border-border')} />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-micro">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className={cn('border px-2 py-1 text-left font-bold', inverted ? 'border-white/25' : 'border-border bg-surface-muted')}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn('border px-2 py-1 align-top', inverted ? 'border-white/25' : 'border-border')}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
