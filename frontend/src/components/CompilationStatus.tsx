import React from 'react';

interface CompilationStatusProps {
  state: 'idle' | 'queued' | 'compiling' | 'ready' | 'error';
}

const CompilationStatus: React.FC<CompilationStatusProps> = ({ state }) => {
  const getStatusConfig = (state: string) => {
    const configs = {
      idle: { text: 'Готов к компиляции', color: 'text-gray-500', bg: 'bg-gray-100' },
      queued: { text: 'В очереди...', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      compiling: { text: 'Компилируется...', color: 'text-blue-600', bg: 'bg-blue-100' },
      ready: { text: 'PDF готов к скачиванию', color: 'text-green-600', bg: 'bg-green-100' },
      error: { text: 'Ошибка компиляции', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return configs[state as keyof typeof configs] || configs.idle;
  };

  const status = getStatusConfig(state);

  return (
    <div className={`px-3 py-2 rounded-md ${status.bg} ${status.color} text-sm font-medium`}>
      <div className="flex items-center justify-between">
        <span>Статус: {status.text}</span>
        {state === 'ready' && (
          <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
            Скачать PDF
          </button>
        )}
        {state === 'error' && (
          <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
            Показать ошибки
          </button>
        )}
      </div>
    </div>
  );
};

export default CompilationStatus;