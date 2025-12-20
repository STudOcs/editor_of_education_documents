// src/pages/document-editor/DocumentEditor.tsx
import { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { htmlToLatex } from '../../shared/lib/latex/htmlToLatex';
import { latexToHtml } from '../../shared/lib/latex/latexToHtml';
import { DocumentSidebar } from '../../widgets/document-sidebar/ui/DocumentSidebar';
import { TipTapEditor } from '../../features/document-editor/ui/TipTapEditor';
import { LatexCodeEditor } from '../../features/document-editor/ui/LatexCodeEditor';

export type ImageRegistry = Record<string, string>; 

const DocumentEditor = () => {
  // ЕДИНЫЙ КОНТЕНТ для всего документа
  const [content, setContent] = useState('<h1>Введение</h1><p>Начните писать...</p>');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const [images, setImages] = useState<ImageRegistry>({});
  
  // Сайдбар теперь просто список-заглушка для навигации или вставки
  const [structure, setStructure] = useState([
    { id: '1', title: 'Титульный лист', type: 'title' },
    { id: '2', title: 'Введение', type: 'intro' },
    { id: '3', title: 'Основная часть', type: 'main' },
  ]);

  const toggleMode = () => {
    if (!isCodeMode) {
      // ПЕРЕДАЕМ реестр в конвертер
      const { latex, newRegistry } = htmlToLatex(content, images);
      setImages(newRegistry);
      setContent(latex);
    } else {
      // ПЕРЕДАЕМ реестр обратно
      setContent(latexToHtml(content, images));
    }
    setIsCodeMode(!isCodeMode);
  };

  return (
    // Весь экран: h-screen, запрещаем скролл
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 font-sans">
      
      {/* Хедер: фиксированный */}
      <header className="h-14 bg-white border-b flex items-center px-4 shrink-0 justify-between z-50">
        <div className="font-bold text-orange-600 tracking-tighter text-xl">СФУ.ДОК</div>
        <div className="flex gap-2">
            <button onClick={toggleMode} className="text-xs border px-3 py-1 rounded hover:bg-gray-50">
                {isCodeMode ? 'Перейти в Визуал' : 'Перейти в LaTeX'}
            </button>
            <button className="bg-orange-600 text-white px-4 py-1 rounded text-sm font-medium">Компиляция</button>
        </div>
      </header>

      {/* Основная рабочая область: flex-1, тоже overflow-hidden */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Сайдбар: свой скролл внутри */}
        <DocumentSidebar 
          blocks={structure as any} 
          onReorderBlocks={setStructure as any}
          activeBlockId="" 
          onSelectBlock={() => {}} // В будущем: скролл к заголовку в TipTap
          onAddBlock={() => {}} 
          onDeleteBlock={() => {}}
        />

        {/* Контейнер редактора */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#f8f9fa]">
          
          {isCodeMode ? (
            // РЕЖИМ КОДА: свой скролл внутри LatexCodeEditor
            <div className="flex-1 overflow-hidden p-4">
               <LatexCodeEditor code={content} onChange={setContent} />
            </div>
          ) : (
            // ВИЗУАЛЬНЫЙ РЕЖИМ: скролл внутри TipTapEditor
            <TipTapEditor 
               content={content} 
               onChange={setContent} 
               onEditorInit={setEditorInstance} 
            />
          )}
          
        </main>

        {/* Предпросмотр: фиксированный */}
        <aside className="w-[350px] border-l bg-gray-50 hidden 2xl:flex items-center justify-center text-gray-400">
           PDF Preview
        </aside>
      </div>
    </div>
  );
};

export default DocumentEditor;