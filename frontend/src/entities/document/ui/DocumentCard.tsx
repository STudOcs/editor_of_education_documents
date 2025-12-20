// src/entities/document/ui/DocumentCard.tsx
import { DocumentItem } from '../model/types';
import { getTemplateName } from '../model/templateMapper';
import { Badge } from '../../../shared/ui/Badge';
import { FileText, MoreVertical, Clock } from 'lucide-react';

export const DocumentCard = ({ doc, onClick }: { doc: DocumentItem, onClick: () => void }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      onClick={onClick}
      className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all cursor-pointer flex flex-col h-[220px] relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
          <FileText size={24} />
        </div>
        <button className="text-gray-400 hover:text-gray-900 p-1">
          <MoreVertical size={20} />
        </button>
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-tight" title={doc.name_doc}>
          {doc.name_doc || "Безымянный документ"}
        </h3>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {getTemplateName(doc.template_id)}
        </p>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        {/* Маппим твой compilation_status на наши стили Badge */}
        <Badge status={doc.compilation_status === 'not_compiled' ? 'draft' : doc.compilation_status as any} />
        
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock size={12} />
          {formatDate(doc.changes_data_doc)}
        </div>
      </div>
    </div>
  );
};