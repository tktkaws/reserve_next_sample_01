'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Reservation, User } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function Home() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purpose, setPurpose] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      const [reservationsData, usersData] = await Promise.all([
        api.getReservations(),
        api.getUsers(),
      ]);
      setReservations(reservationsData);
      setUsers(usersData);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newReservation = await api.createReservation({
        userId: selectedUserId,
        date: selectedDate,
        startTime,
        endTime,
        purpose,
      });
      setReservations([...reservations, newReservation]);
      setPurpose('');
    } catch (error) {
      console.error('予約の作成に失敗しました:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReservation(id);
      setReservations(reservations.filter((r) => r.id !== id));
    } catch (error) {
      console.error('予約の削除に失敗しました:', error);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">会議室予約システム</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">予約フォーム</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">日付</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <label className="block mb-1">開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border rounded"
                step="1800"
              />
            </div>
            <div>
              <label className="block mb-1">終了時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border rounded"
                step="1800"
              />
            </div>
            <div>
              <label className="block mb-1">利用者</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">目的</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              予約する
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">予約一覧</h2>
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const user = users.find((u) => u.id === reservation.userId);
              return (
                <div
                  key={reservation.id}
                  className="border p-4 rounded shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {format(new Date(reservation.date), 'yyyy年MM月dd日(E)', { locale: ja })}
                      </p>
                      <p>
                        {reservation.startTime} - {reservation.endTime}
                      </p>
                      <p>利用者: {user?.name}</p>
                      <p>目的: {reservation.purpose}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(reservation.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
