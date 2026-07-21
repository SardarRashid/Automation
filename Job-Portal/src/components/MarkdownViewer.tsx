import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  if (!content) return null;

  // Split content by lines
  const lines = content.split('\n');
  let inList = false;
  const renderedElements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for headers
    if (trimmed.startsWith('### ')) {
      if (inList) {
        inList = false;
      }
      renderedElements.push(
        <h3 key={index} className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-2">
          {parseInlineMarkdown(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      if (inList) {
        inList = false;
      }
      renderedElements.push(
        <h2 key={index} className="text-xl font-bold text-slate-900 dark:text-white mt-5 mb-3 border-b border-slate-200 dark:border-slate-700 pb-1">
          {parseInlineMarkdown(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      if (inList) {
        inList = false;
      }
      renderedElements.push(
        <h1 key={index} className="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-4">
          {parseInlineMarkdown(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      // Unordered list item
      inList = true;
      renderedElements.push(
        <li key={index} className="ml-5 list-disc text-slate-600 dark:text-slate-300 mb-1.5 leading-relaxed">
          {parseInlineMarkdown(trimmed.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Ordered list item
      inList = true;
      const contentStart = trimmed.indexOf(' ') + 1;
      renderedElements.push(
        <li key={index} className="ml-5 list-decimal text-slate-600 dark:text-slate-300 mb-1.5 leading-relaxed">
          {parseInlineMarkdown(trimmed.substring(contentStart))}
        </li>
      );
    } else if (trimmed === '') {
      if (inList) {
        inList = false;
      }
      renderedElements.push(<div key={index} className="h-2" />);
    } else {
      if (inList) {
        inList = false;
      }
      renderedElements.push(
        <p key={index} className="text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  return (
    <div className="markdown-body font-sans text-sm md:text-base selection:bg-indigo-500/30">
      {renderedElements}
    </div>
  );
}

// Simple parser for **bold** and *italic*
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  while (currentText.length > 0) {
    const boldStart = currentText.indexOf('**');
    const italicStart = currentText.indexOf('*');

    if (boldStart !== -1 && (italicStart === -1 || boldStart < italicStart)) {
      // Handle bold text
      if (boldStart > 0) {
        parts.push(<span key={keyIdx++}>{currentText.substring(0, boldStart)}</span>);
      }
      const nextBold = currentText.indexOf('**', boldStart + 2);
      if (nextBold !== -1) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-slate-900 dark:text-white">
            {currentText.substring(boldStart + 2, nextBold)}
          </strong>
        );
        currentText = currentText.substring(nextBold + 2);
      } else {
        parts.push(<span key={keyIdx++}>{currentText.substring(boldStart)}</span>);
        break;
      }
    } else if (italicStart !== -1) {
      // Handle italic text
      if (italicStart > 0) {
        parts.push(<span key={keyIdx++}>{currentText.substring(0, italicStart)}</span>);
      }
      const nextItalic = currentText.indexOf('*', italicStart + 1);
      if (nextItalic !== -1) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-800 dark:text-slate-200">
            {currentText.substring(italicStart + 1, nextItalic)}
          </em>
        );
        currentText = currentText.substring(nextItalic + 1);
      } else {
        parts.push(<span key={keyIdx++}>{currentText.substring(italicStart)}</span>);
        break;
      }
    } else {
      parts.push(<span key={keyIdx++}>{currentText}</span>);
      break;
    }
  }

  return parts;
}
