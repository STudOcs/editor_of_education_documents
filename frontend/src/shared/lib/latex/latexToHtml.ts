import { ImageRegistry } from '../../../pages/document-editor/DocumentEditor';

export const latexToHtml = (latex: string, registry: ImageRegistry): string => {
  let html = latex;

  const bodyMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (bodyMatch) html = bodyMatch[1];

  html = html.replace(/\\newgeometry\{.*?\}/g, '');
  html = html.replace(/\\restoregeometry/g, '');
  html = html.replace(/\\vfill/g, '<p style="text-align: center;"><br/></p>');
  html = html.replace(/\\newpage/g, '<div data-type="page-break" class="page-break"></div>');
  html = html.replace(/\\+\[\d+mm\]/g, '\\\\'); 
  html = html.replace(/(?<!\\)\[\d+mm\]/g, ''); 

  const titlePageRegex = /\\begin\{titlepage\}([\s\S]*?)\\end\{titlepage\}/g;
  html = html.replace(titlePageRegex, (_match, content: string) => {
    let page = content;

    // Заменяем \begin{center} на параграфы с центрированием
    page = page.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_m, inner) => {
        return inner.split('\\\\').map((line: string) => `<p style="text-align: center;">${line.trim()}</p>`).join('');
    });

    const sigTableRegex = /\\begin\{tabular\}[\s\S]*?\{((?:[^{}]|\{[^{}]*\})*)\}([\s\S]*?)\\end\{tabular\}/g;

    page = page.replace(sigTableRegex, (__match, _args, tableBody: string) => {
      const rows = tableBody.split('\\\\').map(row => {
        const trimmedRow = row.trim();
        if (!trimmedRow) return '';

        const cells = trimmedRow.split('&').map(cell => {
          let c = cell.trim();
          // Линия подписи (текстом)
          c = c.replace(/\\rule\{?[\d.]+\w+\}?\{?[\d.]+\w+\}?/g, '________________');
          // Текст подписи
          c = c.replace(/\\footnotesize\s*\{(.*?)\}/g, '<small>$1</small>');
          c = c.replace(/\\footnotesize\s+/g, '<small>');
          return `<td>${c}</td>`;
        }).join('');

        return `<tr>${cells}</tr>`;
      }).filter(r => r !== '').join('');

      // ОБОРАЧИВАЕМ ТАБЛИЦУ В DIV, чтобы TipTap не стер наши намерения
      return `<div class="signature-section-wrapper"><table class="signature-table"><tbody>${rows}</tbody></table></div>`;
    });

    page = page.replace(/\\textbf\s*\{(.*?)\}/g, '<strong>$1</strong>');
    page = page.replace(/\\textbf\s+([^\s\\]+)/g, '<strong>$1</strong>');
    page = page.replace(/\\large\s*/g, '');
    page = page.replace(/\\\\/g, '<br/>');
    page = page.replace(/\{([\s\S]*?)\}/g, '$1'); 

    return `<blockquote class="title-page">${page}</blockquote>`;
  });

  html = html.replace(/\\newpage/g, '<div class="page-break"></div>');
  html = html.replace(/\\section\{(.*?)\}/g, '<h1 style="text-align: center;">$1</h1>');
  html = html.replace(/\\subsection\{(.*?)\}/g, '<h2 style="text-align: center;">$1</h2>');
  
  const figureRegex = /\\begin\{figure\}[\s\S]*?\\includegraphics.*?\{(.*?)\}[\s\S]*?\\caption\{(.*?)\}[\s\S]*?\\end\{figure\}/g;
  html = html.replace(figureRegex, (_m, file, cap) => {
    const base64 = registry[file.trim()] || '';
    return `<figure class="custom-figure" style="text-align: center;"><img src="${base64}" /><figcaption class="figure-caption">${cap}</figcaption></figure>`;
  });

  // 3. ТАБЛИЦЫ ОБЫЧНЫЕ
  const mainTableRegex = /\\begin\{table\}(?:\[.*?\])?[\s\S]*?\\begin\{tabular\}\{.*?\}\s*([\s\S]*?)\\end\{tabular\}[\s\S]*?\\end\{table\}/g;
  html = html.replace(mainTableRegex, (_match: string, tableBody: string) => {
    const rows = tableBody
      .split(/\\\\/)
      .map((row: string) => row.replace(/\\hline/g, '').trim())
      .filter((row: string) => row.length > 0)
      .map((row: string) => {
        const cells = row.split('&').map((cell: string) => `<td>${cell.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
    return `<table><tbody>${rows}</tbody></table>`;
  });

  // 5. СПИСКИ: очищаем контент внутри от переносов \n, чтобы TipTap не сходил с ума
  html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_m, content) => {
    const items = content.replace(/\\item\s+([^\n]+)/g, '<li>$1</li>').replace(/\n/g, '');
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_m, content) => {
    const items = content.replace(/\\item\s+([^\n]+)/g, '<li>$1</li>').replace(/\n/g, '');
    return `<ol>${items}</ol>`;
  });

  html = html.replace(/~/g, '&nbsp;');
  html = html.replace(/\\the\\year/g, new Date().getFullYear().toString());

  // 6. УМНАЯ ОБЕРТКА
  const blocks = html.split(/\n\s*\n/);
  const finalHtml = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (/^<(h1|h2|h3|table|blockquote|figure|div|ul|ol)/i.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return finalHtml.replace(/>\s+</g, '><');
};