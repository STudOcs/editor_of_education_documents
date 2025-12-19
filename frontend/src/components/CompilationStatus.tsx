import React from 'react';

interface CompilationStatusProps {
  state: 'idle' | 'queued' | 'compiling' | 'ready' | 'error';
}

const CompilationStatus: React.FC<CompilationStatusProps> = ({ state }) => {
  const getStatusConfig = (state: string) => {
    const configs = {
      idle: { 
        text: 'Готов к компиляции', 
        color: 'text-gray-500', 
        bg: 'bg-gray-100',
        icon: '📄'
      },
      queued: { 
        text: 'В очереди...', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100',
        icon: '⏳'
      },
      compiling: { 
        text: 'Компилируется...', 
        color: 'text-blue-600', 
        bg: 'bg-blue-100',
        icon: '⚙️'
      },
      ready: { 
        text: 'PDF готов к скачиванию', 
        color: 'text-green-600', 
        bg: 'bg-green-100',
        icon: '✅'
      },
      error: { 
        text: 'Ошибка компиляции', 
        color: 'text-red-600', 
        bg: 'bg-red-100',
        icon: '❌'
      },
    };
    return configs[state as keyof typeof configs] || configs.idle;
  };

  const status = getStatusConfig(state);

  const handleDownload = () => {
    // Эмуляция скачивания файла
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <div className={`px-4 py-2 rounded-lg ${status.bg} ${status.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{status.icon}</span>
          <div>
            <span className="font-medium">Статус: </span>
            <span>{status.text}</span>
          </div>
        </div>
        {state === 'ready' && (
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Скачать PDF</span>
          </button>
        )}
        {state === 'error' && (
          <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors">
            Показать ошибки
          </button>
        )}
      </div>
      {state === 'compiling' && (
        <div className="mt-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse w-3/4"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompilationStatus;