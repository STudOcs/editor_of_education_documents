// src/features/auth-by-email/ui/RegisterForm.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../shared/api/authService';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    login: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    group_name: '',
    student_card: '',
    department: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Подготовка данных: заменяем пустые строки на undefined для опциональных полей
    const submitData = {
      ...formData,
      middle_name: formData.middle_name || undefined,
      group_name: formData.group_name || "", // Если бэкенд требует строку, шлем пустую
      student_card: formData.student_card || "",
      department: formData.department || undefined,
    };

    try {
      await authService.register(submitData as any);
      alert('Регистрация успешна!');
      navigate('/login');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Ошибка при регистрации. Проверьте данные.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-2xl p-8 bg-white shadow-xl rounded-2xl">
      <div className="text-center">
        <h2 className="text-3xl font-black text-orange-600">СФУ.ДОК</h2>
        <p className="text-gray-500 mt-2">Регистрация студента</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Логин *" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required />
        <Input label="Пароль *" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <Input label="Фамилия *" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
        <Input label="Имя *" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 italic text-gray-400 text-xs">
        Ниже — необязательные поля
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Отчество" value={formData.middle_name} onChange={e => setFormData({...formData, middle_name: e.target.value})} />
        <Input label="Группа" value={formData.group_name} onChange={e => setFormData({...formData, group_name: e.target.value})} />
        <Input label="Зачетка" value={formData.student_card} onChange={e => setFormData({...formData, student_card: e.target.value})} />
      </div>
      
      <Input label="Кафедра" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />

      <Button type="submit" disabled={isLoading}>{isLoading ? 'Регистрация...' : 'Зарегистрироваться'}</Button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Уже есть аккаунт? <Link to="/login" className="text-orange-600 font-bold hover:underline">Войти</Link>
      </p>
    </form>
  );
};