import { useState } from 'react';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { UserProfile, UpdateProfileDto } from '../../../entities/user/model/types';

interface ProfileFormProps {
  initialData: UserProfile;
  onSave: (data: UpdateProfileDto) => void;
}

export const ProfileForm = ({ initialData, onSave }: ProfileFormProps) => {
  const [formData, setFormData] = useState<UserProfile & { password?: string }>({
    ...initialData,
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Собираем только измененные поля
    const changedFields: UpdateProfileDto = {};
    
    (Object.keys(initialData) as Array<keyof UserProfile>).forEach((key) => {
      if (formData[key] !== initialData[key]) {
        changedFields[key] = formData[key];
      }
    });

    // Отдельно проверяем пароль
    if (formData.password && formData.password.trim() !== '') {
      changedFields.password = formData.password;
    }

    onSave(changedFields);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      {/* Личные данные */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-orange-600 rounded-full" />
          Личные данные
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Фамилия" value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
          <Input label="Имя" value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
          <Input label="Отчество" value={formData.middle_name} onChange={(e) => handleChange('middle_name', e.target.value)} />
        </div>
      </section>

      {/* Учебные данные */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-orange-600 rounded-full" />
          Учебные данные
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Номер группы" value={formData.group_name} onChange={(e) => handleChange('group_name', e.target.value)} />
          <Input label="Номер зачетки" value={formData.student_card} onChange={(e) => handleChange('student_card', e.target.value)} />
          <div className="md:col-span-2">
            <Input label="Кафедра" value={formData.department} onChange={(e) => handleChange('department', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Аккаунт */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-orange-600 rounded-full" />
          Безопасность
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
          <Input label="Новый пароль" type="password" placeholder="Оставьте пустым, чтобы не менять" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} />
        </div>
      </section>

      <div className="pt-4 border-t border-gray-100">
        <Button type="submit">Сохранить изменения</Button>
      </div>
    </form>
  );
};