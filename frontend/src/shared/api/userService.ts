// src/shared/api/userService.ts
import { $api } from './base';
import { UserProfile, UpdateProfileDto } from '../../entities/user/model/types';

export const userService = {
    // Получение данных текущего пользователя
    async getProfile(): Promise<UserProfile> {
        const { data } = await $api.get<UserProfile>('/user/profile');
        return data;
    },

    // Частичное обновление профиля
    async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
        const { data } = await $api.patch<UserProfile>('/user/profile', dto);
        return data;
    }
};