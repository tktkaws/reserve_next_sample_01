export type User = {
  id: string;
  name: string;
  email: string;
};

export type Reservation = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export type MeetingRoom = {
  id: number;
  name: string;
  capacity: number;
  equipment: string[];
};

export type UserId = string | null; 