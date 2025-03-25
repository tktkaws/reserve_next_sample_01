import { User, Reservation, MeetingRoom } from '@/types';

const API_BASE_URL = 'http://localhost:3001';

export const api = {
  // ユーザー関連
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('ユーザー情報の取得に失敗しました');
    return response.json();
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...user,
        id: Math.random().toString(36).substring(2, 6), // ランダムな文字列を生成
      }),
    });
    if (!response.ok) throw new Error('ユーザーの作成に失敗しました');
    return response.json();
  },

  updateUser: async (id: string, user: User): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('ユーザー情報の更新に失敗しました');
    return response.json();
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('ユーザーの削除に失敗しました');
  },

  // 予約関連
  getReservations: async (): Promise<Reservation[]> => {
    const response = await fetch(`${API_BASE_URL}/reservations`);
    if (!response.ok) throw new Error('予約情報の取得に失敗しました');
    return response.json();
  },

  createReservation: async (reservation: Omit<Reservation, 'id'>): Promise<Reservation> => {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reservation,
        id: Math.random().toString(36).substring(2, 6), // ランダムな文字列を生成
      }),
    });
    if (!response.ok) throw new Error('予約の作成に失敗しました');
    return response.json();
  },

  deleteReservation: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('予約の削除に失敗しました');
  },

  // 会議室関連
  getMeetingRoom: async (): Promise<MeetingRoom> => {
    const response = await fetch(`${API_BASE_URL}/meetingRoom`);
    return response.json();
  },
}; 