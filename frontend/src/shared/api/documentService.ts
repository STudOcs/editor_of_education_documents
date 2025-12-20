// src/shared/api/documentService.ts
import { $api } from './base';
import { DocumentItem } from '../../entities/document/model/types';
import { TemplateItem } from '../../entities/document/model/types';

export const documentService = {
  // Получить все документы
  async getAll(): Promise<DocumentItem[]> {
    const { data } = await $api.get<DocumentItem[]>('/documents/');
    return data;
  },

  // Получить один по ID
  async getById(id: string): Promise<DocumentItem> {
    const { data } = await $api.get<DocumentItem>(`/documents/${id}`);
    return data;
  },

  // Создать новый
  async create(payload: { name_doc: string, template_id: number }): Promise<DocumentItem> {
    const { data } = await $api.post<DocumentItem>('/documents/', payload);
    return data;
  },

  // Удалить
  async delete(id: number): Promise<void> {
    await $api.delete(`/documents/${id}`);
  },

  async getTemplates(): Promise<TemplateItem[]> {
    const { data } = await $api.get<TemplateItem[]>('/templates/');
    return data;
  },

  async update(doc_id: number, payload: { 
    name_doc?: string; 
    content_json?: any; 
    latex_source?: string 
  }): Promise<DocumentItem> {
    const { data } = await $api.put<DocumentItem>(`/documents/${doc_id}`, payload);
    return data;
  },

};