// src/pages/document-editor/DocumentEditor.tsx
import { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { htmlToLatex } from '../../shared/lib/latex/htmlToLatex';
import { latexToHtml } from '../../shared/lib/latex/latexToHtml';
import { DocumentSidebar } from '../../widgets/document-sidebar/ui/DocumentSidebar';
import { TipTapEditor } from '../../features/document-editor/ui/TipTapEditor';
import { LatexCodeEditor } from '../../features/document-editor/ui/LatexCodeEditor';
import { useParams } from 'react-router-dom';
import { Save, Loader2, Check } from 'lucide-react'; // Иконки
import { DocumentItem } from '../../entities/document/model/types';
import { documentService } from '../../shared/api/documentService';

export type ImageRegistry = Record<string, string>; 

const DocumentEditor = () => {
  // ЕДИНЫЙ КОНТЕНТ для всего документа
  const [content, setContent] = useState('<h1>Введение</h1><p>Начните писать...</p>');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const [images, setImages] = useState<ImageRegistry>({});
  
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [registry, setRegistry] = useState<Record<string, string>>({});

  // Пример в DocumentEditor.tsx
  const { latex, newRegistry } = htmlToLatex(content, registry);
  // И обратно
  const html = latexToHtml(content, registry);

  // Сайдбар теперь просто список-заглушка для навигации или вставки
  const [structure, setStructure] = useState([
    { id: '1', title: 'Титульный лист', type: 'title' },
    { id: '2', title: 'Введение', type: 'intro' },
    { id: '3', title: 'Основная часть', type: 'main' },
  ]);

  useEffect(() => {
    if (id) {
      documentService.getById(id)
        .then((data) => {
          setDoc(data);
          
          // ВАЖНО: Если бэк прислал пустой content_json, но есть latex_source (преамбула шаблона),
          // мы ОБЯЗАТЕЛЬНО конвертируем её сразу.
          const initialHtml = data.content_json?.html || latexToHtml(data.latex_source, {});
          setContent(initialHtml);
        })
        .catch(err => console.error("Load error:", err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleSave = async () => {
    if (!doc || !id) return;
    setSaveStatus('saving');

    try {
      let finalHtml = '';
      let finalLatex = '';

      if (isCodeMode) {
        // Если сохраняем из режима кода
        finalLatex = content;
        finalHtml = latexToHtml(content, registry);
      } else {
        // Если сохраняем из визуала
        const { latex } = htmlToLatex(content, registry);
        finalHtml = content;
        finalLatex = latex;
      }

      await documentService.update(Number(id), {
        content_json: { html: finalHtml }, // Сохраняем как объект
        latex_source: finalLatex
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      alert("Ошибка при сохранении");
      setSaveStatus('idle');
    }
  };

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

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* HEADER с кнопкой сохранения */}
      <header className="h-14 bg-white border-b flex items-center px-4 justify-between z-50">
        <div className="flex items-center gap-4">
          <span className="font-bold text-orange-600">СФУ.ДОК</span>
          <h2 className="text-sm font-medium border-l pl-4 truncate max-w-xs">{doc?.name_doc}</h2>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleMode} className="text-xs border px-3 py-1 rounded hover:bg-gray-50">
            {isCodeMode ? 'Визуальный режим' : 'LaTeX код'}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : 
             saveStatus === 'success' ? <Check size={16} /> : <Save size={16} />}
            {saveStatus === 'saving' ? 'Сохранение...' : saveStatus === 'success' ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <DocumentSidebar blocks={[]} onReorderBlocks={() => {}} activeBlockId="" onSelectBlock={() => {}} onAddBlock={() => {}} onDeleteBlock={() => {}} />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="flex-1 overflow-y-auto">
            <div className={`mx-auto transition-all ${isCodeMode ? 'max-w-4xl p-8 h-full' : 'max-w-[850px]'}`}>
              {isCodeMode ? (
                <LatexCodeEditor code={content} onChange={setContent} />
              ) : (
                <div className="py-10">
                  <TipTapEditor content={content} onChange={setContent} onEditorInit={() => {}} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentEditor;