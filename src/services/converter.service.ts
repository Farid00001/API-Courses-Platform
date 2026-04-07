import fs from 'fs';
import { Marked } from 'marked';
import Prism from 'prismjs';

// Load common Prism languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import katex from 'katex';

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

interface ConversionResult {
  html: string;
  toc: TocEntry[];
}

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render inline LaTeX expressions: $...$ and $$...$$
 */
function renderLatex(text: string): string {
  // Block math: $$...$$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="katex-error">${escapeHtml(formula)}</span>`;
    }
  });

  // Inline math: $...$
  text = text.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${escapeHtml(formula)}</span>`;
    }
  });

  return text;
}

/**
 * Generate a slug-friendly ID from heading text.
 */
function headingToId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Convert a Markdown string to HTML with syntax highlighting, LaTeX, and TOC.
 */
export async function convertMarkdown(content: string): Promise<ConversionResult> {
  const toc: TocEntry[] = [];
  let headingCounter = 0;

  const marked = new Marked();

  const renderer = {
    heading(text: string, depth: number): string {
      headingCounter++;
      const id = `heading-${headingCounter}-${headingToId(text)}`;
      const cleanText = text.replace(/<[^>]*>/g, '');
      toc.push({ level: depth, text: cleanText, id });
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
    code(code: string, infostring?: string): string {
      const language = infostring ? infostring.trim().split(/\s+/)[0] : 'plaintext';
      let highlighted: string;
      if (Prism.languages[language]) {
        highlighted = Prism.highlight(code, Prism.languages[language], language);
      } else {
        highlighted = escapeHtml(code);
      }
      return `<pre><code class="language-${escapeHtml(language)}">${highlighted}</code></pre>`;
    },
  };

  marked.use({ renderer });

  // Render LaTeX in the markdown source before parsing
  const withLatex = renderLatex(content);
  const html = await marked.parse(withLatex);

  const wrappedHtml = `<div class="course-content markdown-body">${html}</div>`;

  return { html: wrappedHtml, toc };
}

/**
 * Convert a Jupyter Notebook JSON to HTML with syntax highlighting and LaTeX.
 */
export async function convertNotebook(filePath: string): Promise<ConversionResult> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const notebook = JSON.parse(raw);
  const toc: TocEntry[] = [];
  let headingCounter = 0;

  const cells: Array<{ cell_type: string; source: string[]; outputs?: Array<Record<string, unknown>> }> =
    notebook.cells || [];

  // Detect kernel language (default to python)
  const kernelLang: string =
    notebook.metadata?.kernelspec?.language ||
    notebook.metadata?.language_info?.name ||
    'python';

  const htmlParts: string[] = [];

  for (const cell of cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '');

    if (cell.cell_type === 'markdown') {
      // Convert markdown cell
      const result = await convertMarkdown(source);
      htmlParts.push(`<div class="cell cell-markdown">${result.html}</div>`);
      toc.push(...result.toc);
    } else if (cell.cell_type === 'code') {
      // Code cell with syntax highlighting
      const lang = kernelLang;
      let highlighted: string;
      if (Prism.languages[lang]) {
        highlighted = Prism.highlight(source, Prism.languages[lang], lang);
      } else {
        highlighted = escapeHtml(source);
      }

      let cellHtml = `<div class="cell cell-code">`;
      cellHtml += `<div class="cell-input"><pre><code class="language-${escapeHtml(lang)}">${highlighted}</code></pre></div>`;

      // Process outputs
      if (cell.outputs && cell.outputs.length > 0) {
        cellHtml += `<div class="cell-output">`;
        for (const output of cell.outputs) {
          cellHtml += renderOutput(output);
        }
        cellHtml += `</div>`;
      }

      cellHtml += `</div>`;
      htmlParts.push(cellHtml);
    } else if (cell.cell_type === 'raw') {
      htmlParts.push(`<div class="cell cell-raw"><pre>${escapeHtml(source)}</pre></div>`);
    }
  }

  const html = `<div class="course-content notebook-body">${htmlParts.join('\n')}</div>`;
  return { html, toc };
}

/**
 * Render a notebook cell output.
 */
function renderOutput(output: Record<string, unknown>): string {
  const outputType = output.output_type as string;

  if (outputType === 'stream') {
    const text = Array.isArray(output.text) ? (output.text as string[]).join('') : String(output.text || '');
    return `<pre class="output-stream">${escapeHtml(text)}</pre>`;
  }

  if (outputType === 'execute_result' || outputType === 'display_data') {
    const data = output.data as Record<string, unknown> | undefined;
    if (!data) return '';

    // Image output
    if (data['image/png']) {
      return `<div class="output-image"><img src="data:image/png;base64,${data['image/png']}" alt="Output" /></div>`;
    }
    if (data['image/jpeg']) {
      return `<div class="output-image"><img src="data:image/jpeg;base64,${data['image/jpeg']}" alt="Output" /></div>`;
    }
    if (data['image/svg+xml']) {
      const svg = Array.isArray(data['image/svg+xml'])
        ? (data['image/svg+xml'] as string[]).join('')
        : String(data['image/svg+xml']);
      return `<div class="output-image">${svg}</div>`;
    }

    // HTML output
    if (data['text/html']) {
      const html = Array.isArray(data['text/html'])
        ? (data['text/html'] as string[]).join('')
        : String(data['text/html']);
      return `<div class="output-html">${html}</div>`;
    }

    // LaTeX output
    if (data['text/latex']) {
      const latex = Array.isArray(data['text/latex'])
        ? (data['text/latex'] as string[]).join('')
        : String(data['text/latex']);
      try {
        const rendered = katex.renderToString(latex.replace(/^\$+|\$+$/g, ''), {
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="output-latex">${rendered}</div>`;
      } catch {
        return `<pre class="output-text">${escapeHtml(latex)}</pre>`;
      }
    }

    // Plain text output
    if (data['text/plain']) {
      const text = Array.isArray(data['text/plain'])
        ? (data['text/plain'] as string[]).join('')
        : String(data['text/plain']);
      return `<pre class="output-text">${escapeHtml(text)}</pre>`;
    }
  }

  if (outputType === 'error') {
    const traceback = output.traceback as string[] | undefined;
    if (traceback) {
      // Strip ANSI escape codes
      const cleanTrace = traceback
        .join('\n')
        .replace(/\x1b\[[0-9;]*m/g, '');
      return `<pre class="output-error">${escapeHtml(cleanTrace)}</pre>`;
    }
  }

  return '';
}

/**
 * Convert a file based on its extension.
 */
export async function convertFile(filePath: string, fileType: 'NOTEBOOK' | 'MARKDOWN'): Promise<ConversionResult> {
  if (fileType === 'MARKDOWN') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return convertMarkdown(content);
  }
  return convertNotebook(filePath);
}
