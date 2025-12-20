export type DocStatus = 'draft' | 'compiled' | 'error';
export type DocType = 'Курсовая работа' | 'ВКР' | 'Отчет по практике' | 'Статья';

export interface DocumentItem { // Переименовали здесь
  id: string;
  title: string;
  type: DocType;
  updatedAt: string;
  status: DocStatus;
}