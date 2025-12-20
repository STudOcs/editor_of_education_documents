// src/entities/user/model/types.ts

// Данные, которые мы получаем от бэкенда для отображения профиля
export interface UserProfile {
  id?: string;
  login: string;
  last_name: string;
  first_name: string;
  // Необязательные поля
  middle_name?: string;
  group_name?: string;
  student_card?: string;
  department?: string;
  email?: string; 
}

// Данные для регистрации (новые пользователи)
export interface RegisterData extends UserProfile {
  password: string;
}

// Данные для обновления (PATCH запрос)
// Partial делает все поля необязательными, так как мы отправляем только "дельту"
export interface UpdateProfileDto extends Partial<UserProfile> {
  password?: string;
}

// Ответ при логине
export interface LoginResponse {
  access_token: string;
  token_type: string;
} 