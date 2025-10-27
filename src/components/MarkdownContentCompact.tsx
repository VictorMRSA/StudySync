import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentCompactProps {
  content: string;
}

export const MarkdownContentCompact = ({ content }: MarkdownContentCompactProps) => {
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
        a: ({node, ...props}) => (
          <a className="text-primary underline hover:text-primary/80 transition-colors text-sm" {...props} />
        ),
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
