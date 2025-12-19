import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TipTapEditor from '../components/editor/TipTapEditor';
import CompilationStatus from '../components/CompilationStatus';

const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [docData, setDocData] = useState({
    id: id,
    title: 'Новый документ',
    lastSaved: new Date().toLocaleTimeString(),
    content: '',
    wordCount: 0,
    charCount: 0
  });

  const [compilationState, setCompilationState] = useState<'idle' | 'queued' | 'compiling' | 'ready' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [showLaTeX, setShowLaTeX] = useState(false);
  const [latexCode, setLatexCode] = useState('');

  useEffect(() => {
    if (id === 'new') {
      const defaultContent = `
        <div class="a4-page">
          <h1>Новый документ</h1>
          <p>Начните писать здесь...</p>
        </div>
      `;
      setDocData({
        id: 'new',
        title: 'Новый документ',
        lastSaved: new Date().toLocaleTimeString(),
        content: defaultContent,
        wordCount: 3,
        charCount: defaultContent.length
      });
    } else {
      const savedDoc = localStorage.getItem(`document_${id}`);
      if (savedDoc) {
        const parsedDoc = JSON.parse(savedDoc);
        setDocData(parsedDoc);
      }
    }
  }, [id]);

  const handleContentChange = (content: string) => {
    // Удаляем HTML теги для подсчета слов
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    setDocData(prev => ({
      ...prev,
      content,
      wordCount: words,
      charCount: content.length
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      localStorage.setItem(`document_${id}`, JSON.stringify({
        ...docData,
        lastSaved: new Date().toLocaleTimeString()
      }));
      setIsSaving(false);
      setDocData(prev => ({
        ...prev,
        lastSaved: new Date().toLocaleTimeString()
      }));
    }, 500);
  };

  const handleCompile = () => {
    setCompilationState('queued');
    
    // Генерация LaTeX кода
    const generatedLatex = convertToLaTeX(docData.content);
    setLatexCode(generatedLatex);
    
    setTimeout(() => setCompilationState('compiling'), 1000);
    setTimeout(() => setCompilationState('ready'), 3000);
  };

  const convertToLaTeX = (html: string): string => {
    let latex = '\\documentclass[12pt,a4paper]{article}\n';
    latex += '\\usepackage[utf8]{inputenc}\n';
    latex += '\\usepackage[T2A]{fontenc}\n';
    latex += '\\usepackage[russian]{babel}\n';
    latex += '\\usepackage{graphicx}\n';
    latex += '\\usepackage{geometry}\n';
    latex += '\\geometry{left=3cm,right=1.5cm,top=2cm,bottom=2cm}\n\n';
    latex += '\\begin{document}\n\n';
    
    let text = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '\\section{$1}\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '\\subsection{$1}\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '\\subsubsection{$1}\n')
      .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '\\textbf{$1}')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '\\emph{$1}')
      .replace(/<u[^>]*>(.*?)<\/u>/g, '\\underline{$1}');
    
    latex += text;
    latex += '\n\\end{document}';
    
    return latex;
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${docData.title.replace(/\s+/g, '_')}.pdf`;
    link.click();
    setCompilationState('idle');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Верхняя панель */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            title="Вернуться к документам"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex-1">
            <input
              type="text"
              value={docData.title}
              onChange={(e) => setDocData(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Введите название документа"
            />
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>Сохранено: {docData.lastSaved}</span>
              <span>{docData.wordCount} слов</span>
              <span>{docData.charCount} символов</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLaTeX(!showLaTeX)}
            className={`px-4 py-2 rounded-lg ${showLaTeX ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {showLaTeX ? 'Визуальный редактор' : 'Показать LaTeX'}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Сохранить</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handleCompile}
            disabled={compilationState === 'compiling' || compilationState === 'queued'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Создать PDF</span>
          </button>
        </div>
      </header>

      {/* Основная область */}
      <main className="flex-1 overflow-hidden">
        {showLaTeX ? (
          <div className="h-full p-4 bg-gray-50">
            <div className="bg-white rounded-lg border p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">LaTeX код</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(latexCode)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Копировать
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono h-[calc(100%-60px)]">
                {latexCode || 'Скомпилируйте документ для генерации LaTeX кода'}
              </pre>
            </div>
          </div>
        ) : (
          <TipTapEditor 
            content={docData.content}
            onContentChange={handleContentChange}
          />
        )}
      </main>

      {/* Статус компиляции */}
      <footer className="border-t border-gray-200 bg-white px-4 py-3">
        <CompilationStatus 
          state={compilationState}
        />
      </footer>
    </div>
  );
};

export default DocumentEditor;