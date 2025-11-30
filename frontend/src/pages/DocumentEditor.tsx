import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TipTapEditor from '../components/editor/TipTapEditor';
import CompilationStatus from '../components/CompilationStatus';

const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState({
    id: id,
    title: 'Отчет по практике',
    lastSaved: new Date().toLocaleTimeString()
  });

  const [compilationState, setCompilationState] = useState<'idle' | 'queued' | 'compiling' | 'ready' | 'error'>('idle');

  const handleSave = () => {
    console.log('Сохранение документа...');
    setDocument(prev => ({...prev, lastSaved: new Date().toLocaleTimeString()}));
  };

  const handleCompile = () => {
    setCompilationState('queued');
    setTimeout(() => setCompilationState('compiling'), 1000);
    setTimeout(() => setCompilationState('ready'), 4000);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">{document.title}</h1>
          <span className="text-sm text-gray-500">Сохранено: {document.lastSaved}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Сохранить
          </button>
          <button 
            onClick={handleCompile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Скомпилировать в PDF
          </button>
          <select className="border border-gray-300 rounded-md px-3 py-2">
            <option>Визуальный редактор</option>
            <option>Режим LaTeX</option>
          </select>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Структура документа</h3>
            <nav className="space-y-2">
              <div className="text-sm text-blue-600 font-medium">Титульный лист</div>
              <div className="text-sm text-gray-700 ml-4">Реферат</div>
              <div className="text-sm text-gray-700 ml-4">Содержание</div>
              <div className="text-sm text-gray-700 ml-4">Введение</div>
              <div className="text-sm text-gray-700 ml-4">Основная часть</div>
              <div className="text-sm text-gray-700 ml-4">Заключение</div>
              <div className="text-sm text-gray-700 ml-4">Список литературы</div>
            </nav>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Элементы</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  📊 Добавить таблицу
                </button>
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  📷 Добавить изображение
                </button>
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  ∫ Добавить формулу
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <TipTapEditor />
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-white px-4 py-2">
        <CompilationStatus state={compilationState} />
      </footer>
    </div>
  );
};

export default DocumentEditor;