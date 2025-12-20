// src/shared/lib/latex/htmlToLatex.ts

import { ImageRegistry } from '../../../pages/document-editor/DocumentEditor';

export const htmlToLatex = (html: string, registry: ImageRegistry) => {
  let tex = html;

  const newRegistry = { ...registry };

  tex = tex.replace(/<p>\s*(<figure[\s\S]*?<\/figure>)\s*<\/p>/g, '$1');
  tex = tex.replace(/<p><p>/g, '<p>').replace(/<\/p><\/p>/g, '<\/p>');
  // 1. Предварительная очистка
  tex = tex.replace(/<li><p>(.*?)<\/p><\/li>/g, '<li>$1</li>');
  tex = tex.replace(/<(td|th)>\s*<p>(.*?)<\/p>\s*<\/\1>/g, '<$1>$2</$1>');

  // 2. Разрыв страницы
  tex = tex.replace(/<div data-type="page-break".*?<\/div>/g, '\n\\newpage\n');

  // 3. Заголовки
  tex = tex.replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}\n');
  tex = tex.replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}\n');
  tex = tex.replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}\n');

  // 4. Списки
  tex = tex.replace(/<li>(.*?)<\/li>/g, '  \\item $1\n');
  tex = tex.replace(/<ul>([\s\S]*?)<\/ul>/g, '\\begin{itemize}\n$1\\end{itemize}\n');
  tex = tex.replace(/<ol>([\s\S]*?)<\/ol>/g, '\\begin{enumerate}\n$1\\end{enumerate}\n');

  // 5. Изображения (Figure) — добавили типы match, src, caption
  const figureRegex = /<figure[\s\S]*?src="(data:image\/.*?;base64,[\s\S]*?)".*?>[\s\S]*?<figcaption.*?>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g;

  tex = tex.replace(figureRegex, (_match, base64, caption) => {
    // Очищаем caption от HTML тегов (вдруг там <strong> и т.д.)
    const cleanCaption = caption.replace(/<\/?[^>]+(>|$)/g, "").trim();

    // Ищем в реестре или создаем новое имя
    let fileName = Object.keys(newRegistry).find(key => newRegistry[key] === base64);
    if (!fileName) {
      fileName = `image_${Object.keys(newRegistry).length + 1}.png`;
      newRegistry[fileName] = base64;
    }

    return `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=\\textwidth]{${fileName}}\n  \\caption{${cleanCaption}}\n\\end{figure}\n`;
  });

  // 6. Таблицы — добавили типы match и body, m и rowContent
  const tableRegex = /<table.*?>[\s\S]*?<tbody.*?>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/g;
  tex = tex.replace(tableRegex, (_match: string, body: string) => {
    const rows = body.match(/<tr[\s\S]*?<\/tr>/g);
    if (!rows || rows.length === 0) return '';

    // БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ ПЕРВОЙ СТРОКИ
    const firstRow = rows[0];
    const firstRowCells = firstRow.match(/<(td|th)[\s\S]*?<\/(td|th)>/g) || [];
    const colCount = firstRowCells.length;
    const colSpec = `|${'l|'.repeat(colCount)}`;

    const processedRows = rows.map((rowHtml: string) => {
      const cellMatches = rowHtml.match(/<(td|th)[\s\S]*?>([\s\S]*?)<\/\1>/g) || [];
      const cells = cellMatches.map((cellHtml: string) => {
        return cellHtml.replace(/<(td|th)[\s\S]*?>([\s\S]*?)<\/\1>/, '$2')
                       .replace(/<p>(.*?)<\/p>/g, '$1') // Убираем p внутри ячеек
                       .trim();
      });
      return `    ${cells.join(' & ')} \\\\ \\hline`;
    }).join('\n');

    return `\n\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{${colSpec}}\n    \\hline\n${processedRows}\n  \\end{tabular}\n\\end{table}\n`;
  });

  // 7. Базовое форматирование
  tex = tex.replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}');
  tex = tex.replace(/<em>(.*?)<\/em>/g, '\\textit{$1}');
  tex = tex.replace(/<u>(.*?)<\/u>/g, '\\underline{$1}');

  // 8. Очистка параграфов

  tex = tex.replace(/<p>(.*?)<\/p>/g, '$1\n');
  tex = tex.replace(/<br\s*\/?>/g, '\n');

  const tempDoc = document.createElement('div');
  tempDoc.innerHTML = tex;
  return { latex: tex, newRegistry };
};