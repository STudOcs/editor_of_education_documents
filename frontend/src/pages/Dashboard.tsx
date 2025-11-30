import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const documents = [
    { id: 1, title: 'Отчет по практике', type: 'Практика', lastModified: '2024-01-15', status: 'Черновик' },
    { id: 2, title: 'Курсовая работа по БД', type: 'Курсовая', lastModified: '2024-01-10', status: 'Завершено' },
  ];

  const templates = [
    { id: 1, name: 'Отчет по учебной практике', description: 'Стандартный шаблон СФУ' },
    { id: 2, name: 'Курсовая работа', description: 'Шаблон для курсовых работ' },
    { id: 3, name: 'Расчетно-графическая работа', description: 'Шаблон для РГР' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Мои документы</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Иван Иванов</span>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Создать документ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Выберите шаблон</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                  Использовать
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Мои документы</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {documents.map(doc => (
                <li key={doc.id}>
                  <Link to={`/document/${doc.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">DOC</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-500">
                            {doc.type} • Изменен {doc.lastModified}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${doc.status === 'Завершено' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {doc.status}
                        </span>
                        <svg className="ml-4 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;