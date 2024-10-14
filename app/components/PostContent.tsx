import { sanitize } from 'isomorphic-dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css'

export function renderContent(content: string) {
  const sanitizedContent = sanitize(content, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height', 'class']
  });

  const elements = sanitizedContent.split(/(?=<(?:p|strong|em|u|s|a|h[1-3]|ul|ol|li|blockquote|img|pre|code))/);

  return elements.map((element, index) => {
    if (element.startsWith('<pre') && element.includes('<code')) {
      const codeMatch = element.match(/<code.*?>([\s\S]*?)<\/code>/);
      if (codeMatch) {
        const code = codeMatch[1];
        const languageMatch = element.match(/class=".*?language-(\w+).*?"/);
        const language = languageMatch ? languageMatch[1] : 'plaintext';
        const highlightedCode = hljs.highlight(code, { language }).value;
        return (
          <pre key={index}>
            <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        );
      }
    }
    return <div key={index} dangerouslySetInnerHTML={{ __html: element }} />;
  });
}
