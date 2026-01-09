import { ImageRegistry } from '../../../pages/document-editor/DocumentEditor';
import { TitleData } from '../../api/authService';

export const htmlToLatex = (
  html: string, 
  registry: ImageRegistry, 
  templateLatex?: string,
  userData?: TitleData | null // Новый аргумент
) => {
  const newRegistry = { ...registry };

  // 1. УДАЛЯЕМ ТИТУЛЬНИК ИЗ ВИЗУАЛА ПОЛНОСТЬЮ
  // Удаляем blockquote вместе с возможной оберткой параграфа
  let bodyOnlyHtml = html.replace(/<p>\s*<blockquote[^>]*>[\s\S]*?<\/blockquote>\s*<\/p>/g, "");
  bodyOnlyHtml = bodyOnlyHtml.replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/g, "");

  // 2. КОНВЕРТИРУЕМ ОСТАВШЕЕСЯ ТЕЛО
  let texBody = bodyOnlyHtml;
  texBody = texBody.replace(/<p><\/p>/g, '') // Удаляем абсолютно пустые параграфы
  texBody = texBody.replace(/>\s+<li/g, '><li') // Убираем пробелы перед пунктами списка
  texBody = texBody.replace(/<\/li>\s+</g, '</li><') // Убираем пробелы после пунктов списка
  texBody = texBody.replace(/>\s+<tr/g, '><tr') // Тоже самое для таблиц
  texBody = texBody.replace(/<\/tr>\s+</g, '</tr><');

  texBody = texBody.replace(/<li><p>(.*?)<\/p><\/li>/g, '<li>$1</li>');
  texBody = texBody.replace(/<td><p>(.*?)<\/p><\/td>/g, '<td>$1</td>');
  texBody = texBody.replace(/&nbsp;/g, ' ');


  // Разрывы
  texBody = texBody.replace(/<div[^>]*class="page-break"[^>]*><\/div>/g, '\n\\newpage\n');

  // Заголовки
  texBody = texBody.replace(/<h1[^>]*>(.*?)<\/h1>/g, '\n\\section{$1}\n');
  texBody = texBody.replace(/<h2[^>]*>(.*?)<\/h2>/g, '\n\\subsection{$1}\n');
  texBody = texBody.replace(/<h3[^>]*>(.*?)<\/h3>/g, '\n\\subsubsection{$1}\n');

  // Форматирование
  texBody = texBody.replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}');
  texBody = texBody.replace(/<em>(.*?)<\/em>/g, '\\textit{$1}');
  texBody = texBody.replace(/&nbsp;/g, ' ');

  // Изображения (Figure)
  const figureRegex = /<figure[^>]*>[\s\S]*?<img src="(data:image\/.*?;base64,[\s\S]*?)".*?>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g;
  texBody = texBody.replace(figureRegex, (_match, base64, caption) => {
    let fileName = Object.keys(newRegistry).find(key => newRegistry[key] === base64);
    if (!fileName) {
      fileName = `image_${Object.keys(newRegistry).length + 1}.png`;
      newRegistry[fileName] = base64;
    }
    return `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=\\textwidth]{${fileName}}\n  \\caption{${caption}}\n\\end{figure}\n`;
  });

  // Таблицы (обычные в тексте)
  const tableRegex = /<table.*?>[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/g;
  texBody = texBody.replace(tableRegex, (_match: string, body: string) => {
    const rows = body.match(/<tr[\s\S]*?<\/tr>/g);
    if (!rows || rows.length === 0) return '';

    // Считаем колонки по самой первой строке (не удаляя её!)
    const firstRowCells = rows[0].match(/<(td|th)[\s\S]*?<\/(td|th)>/g) || [];
    const colCount = firstRowCells.length;
    const colSpec = `|${'l|'.repeat(colCount)}`;

    const processedRows = rows.map((rowHtml: string) => {
      const cellMatches = rowHtml.match(/<(td|th)[\s\S]*?>([\s\S]*?)<\/\1>/g) || [];
      const cells = cellMatches.map((cellHtml: string) => {
        return cellHtml
          .replace(/<(td|th)[\s\S]*?>([\s\S]*?)<\/\1>/, '$2')
          .replace(/<\/?[^>]+(>|$)/g, "") // Стрипим остатки HTML внутри ячейки
          .trim();
      });
      return `    ${cells.join(' & ')} \\\\ \\hline`;
    }).join('\n');

    return `\n\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{${colSpec}}\n    \\hline\n${processedRows}\n  \\end{tabular}\n\\end{table}\n`;
  });

  // 4. СПИСКИ (ФИКС: Добавлены \n для читаемости)
  texBody = texBody.replace(/<li>([\s\S]*?)<\/li>/g, '\\item $1\n'); // Добавляем перенос после каждого item
  texBody = texBody.replace(/<ul>([\s\S]*?)<\/ul>/g, '\n\\begin{itemize}\n$1\\end{itemize}\n');
  texBody = texBody.replace(/<ol>([\s\S]*?)<\/ol>/g, '\n\\begin{enumerate}\n$1\\end{enumerate}\n');

  // Параграфы и переносы
  texBody = texBody.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n');
  texBody = texBody.replace(/<br\s*\/?>/g, '\\\\\n');

  // УДАЛЯЕМ ВСЕ ОСТАТКИ HTML-ТЕГОВ ИЗ ТЕЛА
  texBody = texBody.replace(/<\/?[^>]+(>|$)/g, "").trim();

  // 3. СБОРКА С ШАБЛОНОМ (Берем голову из оригинального LaTeX)
  if (templateLatex) {
    let finalLatex = templateLatex;

    // ПОДСТАНОВКА ДАННЫХ СТУДЕНТА
    if (userData) {
      finalLatex = finalLatex.replace(/VAR_GROUP/g, userData.group || '_______');
      finalLatex = finalLatex.replace(/VAR_CARD/g, userData.student_card || '_______');
      finalLatex = finalLatex.replace(/VAR_STUDENT_SIGNATURE/g, userData.initials || '_______');
      // Если в шаблоне есть кафедра
      finalLatex = finalLatex.replace(/кафедра «»/g, `кафедра «${userData.department || ''}»`);
    }
    let head = "";
    
    // Ищем точку, где заканчивается "каркас" (титульник + оглавление)
    if (finalLatex.includes('\\restoregeometry')) {
      head = finalLatex.split('\\restoregeometry')[0] + '\\restoregeometry';
    } else {
      // Если вообще ничего не нашли (маловероятно), просто берем всё до конца
      head = finalLatex;
    }

    return { 
      latex: `${head.trim()}\n\n${texBody}\n\n\\end{document}`, 
      newRegistry 
    };
  }

  return { latex: texBody, newRegistry };
};