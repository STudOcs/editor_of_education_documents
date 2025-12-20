import { $api } from './base';
import { AuthResponse } from '../../features/auth-by-email/model/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await $api.post<AuthResponse>('/auth/login', { email, password });
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
    }
    return response.data;
  },

  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await $api.post<AuthResponse>('/auth/register', { 
      email, 
      password, 
      fullName 
    });
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  }
};
