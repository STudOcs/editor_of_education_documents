import { DocumentItem } from '../model/types';
import { Badge } from '../../../shared/ui/Badge';
import { FileText, MoreVertical } from 'lucide-react';

export const DocumentCard = ({ doc, onClick }: { doc: DocumentItem, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all cursor-pointer relative"
  >
    {/* ... остальной код без изменений ... */}
    <h3 className="font-semibold text-gray-900 mb-1 truncate leading-tight">
      {doc.title}
    </h3>
    <p className="text-sm text-gray-500 mb-4">{doc.type}</p>
    
    <div className="flex items-center justify-between mt-auto">
      <Badge status={doc.status} />
      <span className="text-[10px] text-gray-400">{doc.updatedAt}</span>
    </div>
  </div>
);