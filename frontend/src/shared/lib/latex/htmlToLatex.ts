// src/shared/lib/latex/htmlToLatex.ts
import { ImageRegistry } from '../../../pages/document-editor/DocumentEditor';

export const htmlToLatex = (html: string, registry: ImageRegistry) => {
  let tex = html;
  const newRegistry = { ...registry };

  // 1. Очистка: TipTap часто вкладывает <p> внутрь <li> или <td>
  tex = tex.replace(/<li><p>(.*?)<\/p><\/li>/g, '<li>$1</li>');
  tex = tex.replace(/<td><p>(.*?)<\/p><\/td>/g, '<td>$1</td>');

  // 2. ТИТУЛЬНЫЙ ЛИСТ (data-type="titlepage")
  const titleDivRegex = /<div[^>]*data-type="titlepage"[^>]*>([\s\S]*?)<\/div>/g;
  tex = tex.replace(titleDivRegex, (_match: string, content: string) => {
    let inner = content;
    inner = inner.replace(/<div style="text-align: center;">([\s\S]*?)<\/div>/g, '\\begin{center}\n$1\n\\end{center}');
    inner = inner.replace(/<br\s*\/?>/g, '\\\\\n');
    inner = inner.replace(/<div style="height: 3em;"><\/div>/g, '\\vfill\n');
    
    inner = inner.replace(/<table class="latex-signature-table"[\s\S]*?>([\s\S]*?)<\/table>/g, (__match, body: string) => {
      const rows = body.match(/<tr>([\s\S]*?)<\/tr>/g);
      if (!rows) return '';
      
      const texRows = rows.map(row => {
        const cells = row.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/g) || [];
        return cells.map(c => {
            let cellContent = c.replace(/<td[\s\S]*?>([\s\S]*?)<\/td>/, '$1').trim();
            cellContent = cellContent.replace(/<u>&nbsp;*<\/u>/g, '\\rule{3cm}{0.1pt}');
            return cellContent;
        }).join(' & ');
      }).join(' \\\\ \n');
      return `\\begin{tabular}{l c m{0.01\\textwidth} l}\n${texRows}\n\\end{tabular}`;
    });

    return `\\begin{titlepage}\n\\newgeometry{top=10mm, bottom=10mm, left=10mm, right=10mm}\n${inner}\n\\end{titlepage}\n\\restoregeometry\n`;
  });

  // 3. РАЗРЫВ СТРАНИЦЫ
  tex = tex.replace(/<div data-type="page-break"[\s\S]*?<\/div>/g, '\n\\newpage\n');

  // 4. ТАБЛИЦЫ
  const tableRegex = /<table.*?>[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/g;
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
                       .replace(/<p>(.*?)<\/p>/g, '$1')
                       .trim();
      });
      return `    ${cells.join(' & ')} \\\\ \\hline`;
    }).join('\n');
    return `\n\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{${colSpec}}\n    \\hline\n${processedRows}\n  \\end{tabular}\n\\end{table}\n`;
  });

  // 5. ИЗОБРАЖЕНИЯ (Figure)
  const figureRegex = /<figure[\s\S]*?src="(data:image\/.*?;base64,[\s\S]*?)".*?>[\s\S]*?<figcaption.*?>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g;
  tex = tex.replace(figureRegex, (_match: string, base64: string, caption: string) => {
    const cleanCaption = caption.replace(/<\/?[^>]+(>|$)/g, "").trim();
    let fileName = Object.keys(newRegistry).find(key => newRegistry[key] === base64);
    if (!fileName) {
      fileName = `image_${Object.keys(newRegistry).length + 1}.png`;
      newRegistry[fileName] = base64;
    }
    return `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=\\textwidth]{${fileName}}\n  \\caption{${cleanCaption}}\n\\end{figure}\n`;
  });

  // 6. ЗАГОЛОВКИ, СПИСКИ, ФОРМАТИРОВАНИЕ
  tex = tex.replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}\n');
  tex = tex.replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}\n');
  tex = tex.replace(/<li>(.*?)<\/li>/g, '  \\item $1\n');
  tex = tex.replace(/<ul>([\s\S]*?)<\/ul>/g, '\\begin{itemize}\n$1\\end{itemize}\n');
  tex = tex.replace(/<ol>([\s\S]*?)<\/ol>/g, '\\begin{enumerate}\n$1\\end{enumerate}\n');
  tex = tex.replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}');
  tex = tex.replace(/<em>(.*?)<\/em>/g, '\\textit{$1}');
  tex = tex.replace(/<u>(.*?)<\/u>/g, '\\underline{$1}');

  // 7. Очистка параграфов
  tex = tex.replace(/<p>(.*?)<\/p>/g, '$1\n');

  return { latex: tex.trim(), newRegistry };
};