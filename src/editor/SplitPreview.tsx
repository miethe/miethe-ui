'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownEditor } from './MarkdownEditor';
import { ScrollArea } from '../primitives/ScrollArea';
import { cn } from '../primitives/utils';

// ============================================================================
// Types
// ============================================================================

export interface SplitPreviewProps {
  content: string;
  onChange: (content: string) => void;
  isEditing: boolean;
  className?: string;
  /**
   * When true, the rendered markdown HTML is passed through rehype-sanitize
   * before display. Strips dangerous constructs: <script>, inline event
   * handlers (onerror=, onclick=, etc.), javascript: URLs, and unsafe elements
   * like <iframe>. When false (default), behavior is identical to before this
   * prop was added — no sanitization, no performance change.
   * @default false
   */
  sanitize?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SplitPreview - Split-view markdown editor with live preview
 *
 * Features:
 * - Left side: MarkdownEditor component
 * - Right side: Rendered markdown preview
 * - Real-time preview updates as user types
 * - GitHub Flavored Markdown (GFM) support
 * - Responsive layout (side-by-side on desktop, stacked on mobile)
 * - Scrollable preview area
 *
 * @example
 * ```tsx
 * <SplitPreview
 *   content={markdownContent}
 *   onChange={(content) => setContent(content)}
 *   isEditing={true}
 * />
 * ```
 */
export function SplitPreview({ content, onChange, isEditing, className, sanitize = false }: SplitPreviewProps) {
  const rehypePlugins = sanitize ? [rehypeSanitize] : [];
  return (
    <div
      className={cn('flex h-full min-w-0 flex-col gap-4 overflow-hidden lg:flex-row', className)}
    >
      {/* Editor Panel - Only shown in edit mode */}
      {isEditing && (
        <div className="min-h-[300px] min-w-0 flex-1 lg:min-h-0">
          <MarkdownEditor initialContent={content} onChange={onChange} className="h-full" />
        </div>
      )}

      {/* Preview Panel - Always shown for markdown */}
      <div
        className={cn(
          'min-h-[300px] min-w-0 flex-1 overflow-hidden lg:min-h-0',
          !isEditing && 'w-full'
        )}
      >
        <div className="h-full overflow-hidden rounded-md border bg-card">
          <ScrollArea className="h-full w-full [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:!min-w-0">
            <div className="prose prose-sm max-w-none overflow-x-hidden break-words p-6 [overflow-wrap:anywhere] [word-break:break-word] dark:prose-invert prose-headings:break-words prose-p:break-words prose-code:break-all prose-pre:overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins}>
                {content || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
