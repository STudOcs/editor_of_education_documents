import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react'; // Добавили Info сюда
import { TEMPLATES } from '../../entities/template/model/types';
import { TemplateCard } from '../../entities/template/ui/TemplateCard';

const DocumentCreate = () => {
  const navigate = useNavigate();

  const handleSelectTemplate = (templateId: string) => {
    console.log(`Создаем документ по шаблону: ${templateId}`);
    navigate(`/editor/new?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Выбор шаблона документа</h1>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">С чего начнем?</h2>
          <p className="text-gray-600">
            Все шаблоны настроены согласно стандартам СТО СФУ. 
            <br />Вы сможете изменить структуру позже.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEMPLATES.map((template) => (
            <TemplateCard 
              key={template.id} 
              template={template} 
              onSelect={handleSelectTemplate} 
            />
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 border border-blue-100 rounded-xl flex gap-4">
          <div className="text-blue-600">
            <Info size={24} /> {/* Исправлено здесь: убрали Icons. */}
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">Подсказка по СТО СФУ</h4>
            <p className="text-sm text-blue-800 mt-1">
              Если вы пишете ВКР, убедитесь, что в профиле указана ваша кафедра. 
              Система автоматически подставит ФИО заведующего и научного руководителя в титульный лист.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentCreate;