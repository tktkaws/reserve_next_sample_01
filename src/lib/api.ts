import { User, Reservation, MeetingRoom } from '@/types';

const API_BASE_URL = 'http://localhost:3001';

export const api = {
  // ユーザー関連
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    return response.json();
  },

  updateUser: async (id: number, user: Partial<User>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    return response.json();
  },

  deleteUser: async (id: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
  },

  // 予約関連
  getReservations: async (): Promise<Reservation[]> => {
    const response = await fetch(`${API_BASE_URL}/reservations`);
    return response.json();
  },

  createReservation: async (reservation: Omit<Reservation, 'id'>): Promise<Reservation> => {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation),
    });
    return response.json();
  },

  deleteReservation: async (id: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'DELETE',
    });
  },

  // 会議室関連
  getMeetingRoom: async (): Promise<MeetingRoom> => {
    const response = await fetch(`${API_BASE_URL}/meetingRoom`);
    return response.json();
  },
}; 