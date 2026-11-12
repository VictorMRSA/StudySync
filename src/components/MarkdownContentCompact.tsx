import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, ExternalLink } from 'lucide-react';

interface MarkdownContentCompactProps {
  content: string;
  onMaterialClick?: (materialId: string) => void;
}

export const MarkdownContentCompact = ({ content, onMaterialClick }: MarkdownContentCompactProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => (
          <h1 className="text-xl font-bold mb-2 mt-3 text-foreground border-b border-primary/50 pb-1" {...props} />
        ),
        h2: ({node, ...props}) => (
          <h2 className="text-lg font-bold mb-2 mt-3 text-foreground border-b border-muted pb-1" {...props} />
        ),
        h3: ({node, ...props}) => (
          <h3 className="text-base font-semibold mb-1 mt-2 text-foreground" {...props} />
        ),
        h4: ({node, ...props}) => (
          <h4 className="text-base font-semibold mb-1 mt-2 text-foreground" {...props} />
        ),
        strong: ({node, ...props}) => (
          <strong className="font-bold text-primary" {...props} />
        ),
        em: ({node, ...props}) => (
          <em className="italic text-accent" {...props} />
        ),
        ul: ({node, ...props}) => (
          <ul className="list-disc list-outside ml-5 space-y-1 my-2" {...props} />
        ),
        ol: ({node, ...props}) => (
          <ol className="list-decimal list-outside ml-5 space-y-1 my-2" {...props} />
        ),
        li: ({node, ...props}) => (
          <li className="text-foreground leading-snug text-sm" {...props} />
        ),
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-2 border-primary bg-primary/5 pl-3 py-1 italic my-2 text-muted-foreground text-sm rounded-r" {...props} />
        ),
        code: ({node, inline, ...props}: any) => 
          inline 
            ? <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-accent" {...props} />
            : <code className="block bg-slate-900 dark:bg-slate-950 text-slate-100 p-2 rounded my-2 overflow-x-auto font-mono text-xs" {...props} />,
        pre: ({node, ...props}) => (
          <pre className="bg-slate-900 dark:bg-slate-950 rounded my-2 overflow-x-auto" {...props} />
        ),
        p: ({node, ...props}) => (
          <p className="mb-2 leading-relaxed text-foreground text-sm" {...props} />
        ),
        a: ({node, href, children, ...props}: any) => {
          if (href && (href.startsWith('#material-') || href.startsWith('material:'))) {
            const materialId = href.replace(/^#material-/, '').replace(/^material:/, '');
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMaterialClick?.(materialId);
                }}
                className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent/80 bg-accent/10 hover:bg-accent/20 px-1.5 py-0.5 rounded text-xs transition-all cursor-pointer border border-accent/25 mx-0.5 align-baseline"
                title="Clique para abrir e visualizar este material"
              >
                <FileText className="w-3 h-3 text-accent inline-block shrink-0" />
                <span className="underline-offset-2 hover:underline">{children}</span>
                <ExternalLink className="w-2.5 h-2.5 inline-block opacity-70 shrink-0" />
              </button>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 transition-colors text-sm"
              {...props}
            >
              {children}
            </a>
          );
        },
        hr: ({node, ...props}) => (
          <hr className="my-3 border-t border-muted" {...props} />
        ),
        table: ({node, ...props}) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full divide-y divide-muted border border-muted rounded text-xs" {...props} />
          </div>
        ),
        thead: ({node, ...props}) => (
          <thead className="bg-muted/30" {...props} />
        ),
        tbody: ({node, ...props}) => (
          <tbody className="divide-y divide-muted bg-card" {...props} />
        ),
        tr: ({node, ...props}) => (
          <tr className="hover:bg-muted/10 transition-colors" {...props} />
        ),
        th: ({node, ...props}) => (
          <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="px-2 py-1.5 text-xs text-foreground" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
