/**
 * Shared parser utilities and helper functions.
 */

/**
 * Detects whether a file is a CircleCI config or a Terraform file based on extension and content.
 * @param {string} filename - The name of the file.
 * @param {string} content - The file contents.
 * @returns {'circleci' | 'terraform' | 'unknown'}
 */
export function detectFileType(filename, content) {
  const ext = filename.split('.').pop().toLowerCase();
  
  if (ext === 'tf') {
    return 'terraform';
  }
  
  if (ext === 'yml' || ext === 'yaml') {
    // Check for common CircleCI keys in content
    if (content.includes('version:') && (content.includes('jobs:') || content.includes('workflows:'))) {
      return 'circleci';
    }
  }

  // Fallback content-based detection
  if (content.includes('resource "') || content.includes('provider "') || content.includes('variable "')) {
    return 'terraform';
  }

  if (content.includes('workflows:') && content.includes('jobs:')) {
    return 'circleci';
  }

  return 'unknown';
}

/**
 * Finds the line number of a given substring or key in text.
 * Helps with mapping errors back to line numbers.
 * @param {string} text - The full text.
 * @param {string} searchString - The string or regex to search for.
 * @param {number} startFromLine - Start search from this line index (0-based).
 * @returns {number} 1-based line number, or 1 if not found.
 */
export function findLineNumber(text, searchString, startFromLine = 0) {
  const lines = text.split('\n');
  const term = typeof searchString === 'string' ? searchString.trim() : searchString;

  for (let i = startFromLine; i < lines.length; i++) {
    if (lines[i].includes(term)) {
      return i + 1;
    }
  }

  // Regex fallback
  if (searchString instanceof RegExp) {
    for (let i = startFromLine; i < lines.length; i++) {
      if (searchString.test(lines[i])) {
        return i + 1;
      }
    }
  }

  return 1;
}

/**
 * Basic syntax highlighting helper for file previews.
 * @param {string} text - Raw code.
 * @param {'yaml' | 'hcl'} type - Code language.
 * @returns {string} HTML with span badges for syntax.
 */
export function highlightSyntax(text, type) {
  // Simple escape HTML
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (type === 'yaml') {
    // Highlight YAML keys, strings, comments
    escaped = escaped
      .replace(/(^|[\s{,])([a-zA-Z0-9_\-]+):/g, '$1<span class="kw">$2</span>:')
      .replace(/(#.*)$/gm, '<span class="comment">$1</span>')
      .replace(/(".*?"|'.*?')/g, '<span class="str">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="type">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  } else if (type === 'hcl') {
    // Highlight HCL keys, blocks, comments, strings
    escaped = escaped
      .replace(/\b(resource|provider|variable|locals|output|module|data)\b/g, '<span class="kw">$1</span>')
      .replace(/(#.*|\/\/.*)$/gm, '<span class="comment">$1</span>')
      .replace(/\/\*[\s\S]*?\*\//g, (m) => `<span class="comment">${m}</span>`)
      .replace(/(".*?")/g, '<span class="str">$1</span>')
      .replace(/\b(true|false)\b/g, '<span class="type">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  return escaped;
}
