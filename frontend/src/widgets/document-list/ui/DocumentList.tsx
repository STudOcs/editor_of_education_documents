import { DocumentCard } from '../../../entities/document/ui/DocumentCard';
import { MOCK_DOCUMENTS } from '../../../entities/document/model/mockData';
import { useNavigate } from 'react-router-dom';

export const DocumentList = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {/* Кнопка создания нового документа всегда первая */}
      <div 
        onClick={() => navigate('/create')}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-orange-100 text-gray-400 group-hover:text-orange-600 transition-colors">
          <span className="text-2xl font-light">+</span>
        </div>
        <span className="text-sm font-medium text-gray-500 group-hover:text-orange-700">Создать документ</span>
      </div>

      {/* Вывод списка */}
      {MOCK_DOCUMENTS.map((doc) => (
        <DocumentCard 
          key={doc.id} 
          doc={doc} 
          onClick={() => navigate(`/editor/${doc.id}`)} 
        />
      ))}
    </div>
  );
};