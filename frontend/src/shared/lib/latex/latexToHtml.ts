import { ImageRegistry } from '../../../pages/document-editor/DocumentEditor';

export const latexToHtml = (latex: string, registry: ImageRegistry): string => {
  let html = latex;

  // 0. ПРЕДВАРИТЕЛЬНАЯ ОЧИСТКА ТЕХНИЧЕСКИХ КОМАНД
  // Удаляем преамбулу до \begin{document} и после \end{document}
  const bodyMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (bodyMatch) {
    html = bodyMatch[1];
  }

  // Удаляем специфические команды разметки, которые не нужны в визуале
  html = html.replace(/\\newgeometry\{.*?\}/g, '');
  html = html.replace(/\\restoregeometry/g, '');
  html = html.replace(/\\vfill/g, '<div style="height: 2em;"></div>');
  html = html.replace(/\\newpage/g, '<div data-type="page-break" class="page-break"><span>Новая страница</span></div>');
  html = html.replace(/\\tableofcontents/g, '<div style="background: #f9f9f9; padding: 10px; border: 1px dashed #ccc; text-align: center; margin: 10px 0;">[СОДЕРЖАНИЕ ГЕНЕРИРУЕТСЯ АВТОМАТИЧЕСЧКИ]</div>');

  // 1. ТИТУЛЬНЫЙ ЛИСТ
  const titlePageRegex = /\\begin\{titlepage\}([\s\S]*?)\\end\{titlepage\}/g;
  html = html.replace(titlePageRegex, (_match, content: string) => {
    let page = content;
    
    // Центрирование
    page = page.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div style="text-align: center;">$1</div>');
    
    // Очистка от скобок групп {...}
    page = page.replace(/\{([\s\S]*?)\}/g, '$1');

    // Переносы строк LaTeX
    page = page.replace(/\\\\/g, '<br/>');
    page = page.replace(/\\\[\d+mm\]/g, '<br/>');

    // Команды размера и начертания
    page = page.replace(/\\large/g, '');
    page = page.replace(/\\large /g, '');
    page = page.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
    page = page.replace(/\{\\footnotesize (.*?)\}/g, '<small style="color: #666;">$1</small>');

    // ТАБЛИЦА ПОДПИСЕЙ (делаем её невидимой)
    const sigTableRegex = /\\begin\{tabular\}\{.*?\}\s*([\s\S]*?)\\end\{tabular\}/g;
    page = page.replace(sigTableRegex, (__match, tableBody: string) => {
      const rows = tableBody.split('\\\\').map(row => {
        // Игнорируем строки, которые содержат только отступы типа [10mm]
        if (row.trim().startsWith('[') && row.trim().endsWith(']')) return '';
        
        const cells = row.split('&').map(cell => {
          let c = cell.trim();
          // Заменяем линию \rule на нижнее подчеркивание
          c = c.replace(/\\rule\{.*?\}\{.*?\}/g, '<span style="border-bottom: 1px solid black; min-width: 80px; display: inline-block;">&nbsp;</span>');
          return `<td style="padding: 4px; vertical-align: top; border: none !important;">${c}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).filter(r => r !== '').join('');
      
      return `<table class="latex-signature-table" style="width: 100%; border: none !important; margin-top: 20px;"><tbody>${rows}</tbody></table>`;
    });

    return `<div class="latex-title-page" data-type="titlepage" style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.2;">${page}</div>`;
  });

  // 2. ТАБЛИЦЫ ОБЫЧНЫЕ
  const tableRegex = /\\begin\{table\}(?:\[.*?\])?[\s\S]*?\\begin\{tabular\}\{.*?\}\s*([\s\S]*?)\\end\{tabular\}[\s\S]*?\\end\{table\}/g;
  html = html.replace(tableRegex, (_match: string, tableBody: string) => {
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

  // 3. КАРТИНКИ
  const figureRegex = /\\begin\{figure\}(?:\[.*?\])?[\s\S]*?\\includegraphics(?:\[.*?\])?\{(.*?)\}[\s\S]*?\\caption\{(.*?)\}[\s\S]*?\\end\{figure\}/g;
  html = html.replace(figureRegex, (_match: string, fileName: string, caption: string) => {
    const name = fileName.trim();
    const base64 = registry[name] || '';
    return `<figure class="custom-figure"><img src="${base64}" alt="${caption}" /><figcaption class="figure-caption">${caption}</figcaption></figure>`;
  });

  // 4. ОСТАЛЬНЫЕ БАЗОВЫЕ ПРАВИЛА
  html = html.replace(/\\section\{(.*?)\}/g, '<h1>$1</h1>');
  html = html.replace(/\\subsection\{(.*?)\}/g, '<h2>$1</h2>');
  html = html.replace(/\\item\s+(.*?)(\n|$)/g, '<li>$1</li>');
  html = html.replace(/\\begin\{itemize\}/g, '<ul>').replace(/\\end\{itemize\}/g, '</ul>');
  html = html.replace(/\\begin\{enumerate\}/g, '<ol>').replace(/\\end\{enumerate\}/g, '</ol>');
  html = html.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{(.*?)\}/g, '<em>$1</em>');
  
  // Убираем оставшиеся одиночные обратные слеши и символы LaTeX
  html = html.replace(/\\ /g, ' ');
  html = html.replace(/~/g, '&nbsp;');
  html = html.replace(/\\the\\year/g, new Date().getFullYear().toString());

  // 5. ОБЕРТКА В ПАРАГРАФЫ
  const blocks = html.split('\n');
  html = blocks.map((block: string) => {
    const t = block.trim();
    if (!t) return '';
    if (t.startsWith('<h') || t.startsWith('<table') || t.startsWith('<ul') || t.startsWith('<ol') || t.startsWith('<div') || t.startsWith('<figure')) {
      return t;
    }
    return `<p>${t}</p>`;
  }).join('');

  return html;
};