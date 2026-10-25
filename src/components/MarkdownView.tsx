import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, title }) => (
            <a
              href={href}
              title={title}
              target="_blank"
              rel="noreferrer noopener"
            >
              {children}
            </a>
          ),
          img: ({ src, alt, title }) => (
            <img
              src={typeof src === "string" ? src : undefined}
              alt={alt ?? ""}
              title={title}
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
