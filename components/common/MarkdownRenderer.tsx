import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold mt-4 mb-2" />,
          h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold mt-4 mb-2" />,
          h3: ({node, ...props}) => <h3 {...props} className="text-base font-bold mt-3 mb-2" />,
          p: ({node, ...props}) => <p {...props} className="my-2 leading-7" />,
          ul: ({node, ...props}) => <ul {...props} className="list-disc ml-6 my-2" />,
          ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-6 my-2" />,
          li: ({node, ...props}) => <li {...props} className="my-1" />,
          strong: ({node, ...props}) => <strong {...props} className="font-semibold" />,
          em: ({node, ...props}) => <em {...props} className="italic" />,
          code: ({node, inline, ...props}) =>
            inline ? (
              <code {...props} className="px-1 py-0.5 rounded bg-gray-100 text-gray-800" />
            ) : (
              <code {...props} className="block p-3 rounded bg-gray-900 text-gray-100 overflow-x-auto text-sm" />
            ),
          blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-gray-300 pl-4 my-2 text-gray-700" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
