import { ProfileForm } from '../../features/update-profile/ui/ProfileForm';
import { UpdateProfileDto, UserProfile } from '../../entities/user/model/types';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { userService } from '../../shared/api/userService';

// const MOCK_USER: UserProfile = {
//   last_name: 'Иванов',
//   first_name: 'Иван',
//   middle_name: 'Иванович',
//   group_name: 'КИ21-01',
//   student_card: '21104432',
//   department: 'Кафедра систем искусственного интеллекта',
//   email: 'ivanov@sfu-kras.ru',
// };

const ProfilePage = () => {
  const navigate = useNavigate();
  const feedbackUrl = "https://docs.google.com/forms/d/e/1FAIpQLScuvUkGg41Uax6eSm3YTB7dLTbKV4ZTZwObdqewu5MvkJ1D3w/viewform?usp=publish-editor";


  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      userService.getProfile()
          .then(data => setUser(data))
          .catch(err => setError('Не удалось загрузить данные профиля'))
          .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (changedData: UpdateProfileDto) => {
      try {
          const updatedUser = await userService.updateProfile(changedData);
          setUser(updatedUser); // Обновляем локальное состояние новыми данными
          alert("Профиль успешно обновлен");
      } catch (err: any) {
          alert(err.response?.data?.message || "Ошибка при сохранении");
      }
  };

  if (isLoading) return <div className="p-20 text-center text-orange-600">Загрузка профиля...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Профиль студента</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Форма */}
        {user && (
            <ProfileForm 
                initialData={user} 
                onSave={handleSave} 
            />
        )}

        {/* Секция обратной связи */}
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center shrink-0">
              <MessageCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-orange-900">Нашли ошибку или есть предложение?</h4>
              <p className="text-sm text-orange-800">Помогите нам сделать СФУ.ДОК лучше, заполнив форму обратной связи.</p>
            </div>
          </div>
          <a 
            href={feedbackUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Написать нам
          </a>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;