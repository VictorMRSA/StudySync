import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => (
          <h1 className="text-3xl font-bold mb-4 mt-6 text-foreground border-b-2 border-primary pb-2" {...props} />
        ),
        h2: ({node, ...props}) => (
          <h2 className="text-2xl font-bold mb-3 mt-6 text-foreground border-b border-muted pb-2" {...props} />
        ),
        h3: ({node, ...props}) => (
          <h3 className="text-xl font-semibold mb-2 mt-4 text-foreground" {...props} />
        ),
        h4: ({node, ...props}) => (
          <h4 className="text-lg font-semibold mb-2 mt-3 text-foreground" {...props} />
        ),
        strong: ({node, ...props}) => (
          <strong className="font-bold text-primary" {...props} />
        ),
        em: ({node, ...props}) => (
          <em className="italic text-accent" {...props} />
        ),
        ul: ({node, ...props}) => (
          <ul className="list-disc list-outside ml-6 space-y-2 my-3" {...props} />
        ),
        ol: ({node, ...props}) => (
          <ol className="list-decimal list-outside ml-6 space-y-2 my-3" {...props} />
        ),
        li: ({node, ...props}) => (
          <li className="text-foreground leading-relaxed" {...props} />
        ),
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-primary bg-primary/5 pl-4 py-2 italic my-4 text-muted-foreground rounded-r" {...props} />
        ),
        code: ({node, inline, ...props}: any) => 
          inline 
            ? <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-accent" {...props} />
            : <code className="block bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm" {...props} />,
        pre: ({node, ...props}) => (
          <pre className="bg-slate-900 dark:bg-slate-950 rounded-lg my-4 overflow-x-auto" {...props} />
        ),
        p: ({node, ...props}) => (
          <p className="mb-3 leading-relaxed text-foreground" {...props} />
        ),
        a: ({node, ...props}) => (
          <a className="text-primary underline hover:text-primary/80 transition-colors" {...props} />
        ),
        hr: ({node, ...props}) => (
          <hr className="my-6 border-t border-muted" {...props} />
        ),
        table: ({node, ...props}) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-muted border border-muted rounded-lg" {...props} />
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
          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="px-4 py-3 text-sm text-foreground" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
