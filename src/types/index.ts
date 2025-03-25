export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Reservation {
  id: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface MeetingRoom {
  id: number;
  name: string;
  capacity: number;
  equipment: string[];
}

export type UserId = number | null; 