import { DocStatus } from '../../entities/document/model/types';

// Указываем Record<DocStatus, string>, чтобы TS понимал, что ключи — это наши статусы
const statusStyles: Record<DocStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  compiled: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

export const Badge = ({ status }: { status: DocStatus }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[status]}`}>
    {status === 'compiled' ? 'Готов' : status === 'draft' ? 'Черновик' : 'Ошибка'}
  </span>
);