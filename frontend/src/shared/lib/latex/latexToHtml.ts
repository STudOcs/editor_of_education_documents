// src/shared/lib/latex/latexToHtml.ts

import { ImageRegistry } from '../../../pages/document-editor/DocumentEditor';

export const latexToHtml = (latex: string, registry: ImageRegistry): string => {
  let html = latex;

  // 1. Разрыв страницы
  html = html.replace(/\\newpage/g, '<div data-type="page-break" class="page-break"><span>Разрыв страницы (\\\\newpage)</span></div>');

  // 2. Заголовки
  html = html.replace(/\\section\{(.*?)\}/g, '<h1>$1</h1>');
  html = html.replace(/\\subsection\{(.*?)\}/g, '<h2>$1</h2>');
  html = html.replace(/\\subsubsection\{(.*?)\}/g, '<h3>$1</h3>');

  // 3. Списки
  html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, '<ul>$1</ul>');
  html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, '<ol>$1</ol>');
  html = html.replace(/\\item\s+(.*?)(\n|$)/g, '<li>$1</li>');

  // 4. Таблицы — добавили типы match, body, row, cell
  const tableRegex = /\\begin\{table\}(?:\[.*?\])?[\s\S]*?\\begin\{tabular\}\{.*?\}\s*([\s\S]*?)\\end\{tabular\}[\s\S]*?\\end\{table\}/g;
  
  html = html.replace(tableRegex, (_match: string, tableBody: string) => {
    // Разбиваем тело на строки по \\
    const rows = tableBody
      .split(/\\\\/)
      .map((row: string) => row.replace(/\\hline/g, '').trim())
      .filter((row: string) => row.length > 0);

    const htmlRows = rows.map((row: string) => {
      // Разбиваем строку на ячейки по &
      const cells = row.split('&').map((cell: string) => {
        return `<td>${cell.trim()}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `<table><tbody>${htmlRows}</tbody></table>`;
  });


  // 5. Изображения (Figure) — добавили типы match, caption
  const figureRegex = /\\begin\{figure\}[\s\S]*?\\includegraphics.*?\{(.*?)\}[\s\S]*?\\caption\{(.*?)\}[\s\S]*?\\end\{figure\}/g;

  html = html.replace(figureRegex, (_match, fileName, caption) => {
    const name = fileName.trim();
    const base64 = registry[name] || '';

    // Возвращаем структуру, которую TipTap понимает как наш Figure
    return `
<figure class="custom-figure">
  <img src="${base64}" alt="${caption}" />
  <figcaption class="figure-caption">${caption}</figcaption>
</figure>`;
  });

  // 6. Форматирование
  html = html.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{(.*?)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{(.*?)\}/g, '<u>$1</u>');

  // 7. Финальная чистка параграфов
  const blocks = html.split('\n\n');
  html = blocks.map((block: string) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<table') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<div')) {
      return trimmed;
    }
    return `<p>${trimmed}</p>`;
  }).join('');

  return html;
};