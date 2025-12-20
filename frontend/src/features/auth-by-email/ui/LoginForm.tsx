import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { authService } from '../../../shared/api/authService';

export const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        await authService.register(email, password, fullName);
      }
      // После успешного входа редиректим в личный кабинет
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl border border-gray-100">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isLogin ? 'Вход в систему' : 'Регистрация'}
        </h1>
        <p className="text-gray-500 text-sm mt-2">Редактор учебных документов СФУ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
            {error}
          </div>
        )}

        {!isLogin && (
          <Input 
            label="ФИО" 
            placeholder="Иванов Иван Иванович" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        
        <Input 
          label="Email" 
          type="email" 
          placeholder="student@sfu-kras.ru" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input 
          label="Пароль" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="text-orange-600 hover:underline text-sm"
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};