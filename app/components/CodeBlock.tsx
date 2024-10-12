import React from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  React.useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const detectedLanguage = language || detectLanguage(code);

  return (
    <pre>
      <code className={`language-${detectedLanguage}`}>
        {code}
      </code>
    </pre>
  );
};

function detectLanguage(code: string): string {
  // 簡単な言語検出ロジック
  if (code.includes('function') || code.includes('var') || code.includes('let') || code.includes('const')) {
    return 'javascript';
  } else if (code.includes('interface') || code.includes('type ') || code.includes(':')) {
    return 'typescript';
  } else if (code.includes('{') && code.includes('}') && code.includes(':')) {
    return 'json';
  } else if (code.includes('{') && code.includes('}') && (code.includes('.') || code.includes('#'))) {
    return 'css';
  }
  return 'plaintext';
}

export default CodeBlock;
