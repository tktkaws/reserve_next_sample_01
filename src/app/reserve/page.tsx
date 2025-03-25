'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Reservation, User, UserId } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ReservePage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purpose, setPurpose] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<UserId>(null);
  const [error, setError] = useState<string>('');

  // 15分刻みの時間オプションを生成
  const timeOptions = Array.from({ length: 37 }, (_, i) => {
    const hour = Math.floor(i / 4) + 9; // 9時から開始
    const minute = (i % 4) * 15; // 0, 15, 30, 45分
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservationsData, usersData] = await Promise.all([
          api.getReservations(),
          api.getUsers(),
        ]);
        setReservations(reservationsData);
        setUsers(usersData);
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
        setError('データの取得に失敗しました。ページを更新してください。');
      }
    };
    fetchData();
  }, []);

  const getUserName = (userId: number): string => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : '不明';
  };

  const isTimeOverlap = (newStart: string, newEnd: string, existingStart: string, existingEnd: string): boolean => {
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('利用者を選択してください');
      return;
    }

    // 時間のバリデーション
    if (startTime >= endTime) {
      setError('終了時間は開始時間より後を選択してください');
      return;
    }

    // 同一時刻の予約チェック
    const hasOverlap = reservations.some((reservation) => {
      if (reservation.date !== selectedDate) return false;
      return isTimeOverlap(startTime, endTime, reservation.startTime, reservation.endTime);
    });

    if (hasOverlap) {
      setError('選択された時間帯は既に予約が入っています');
      return;
    }

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
      setSelectedUserId(null);
      setError('');
    } catch (error) {
      console.error('予約の作成に失敗しました:', error);
      if (error instanceof Error) {
        setError(`予約の作成に失敗しました: ${error.message}`);
      } else {
        setError('予約の作成に失敗しました。時間が重複している可能性があります。');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReservation(id);
      setReservations(reservations.filter((r) => r.id !== id));
      setError('');
    } catch (error) {
      console.error('予約の削除に失敗しました:', error);
      setError('予約の削除に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">会議室予約</h1>
      
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
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">9:00から18:00の間で15分刻みで選択してください</p>
            </div>
            <div>
              <label className="block mb-1">終了時間</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">9:00から18:00の間で15分刻みで選択してください</p>
            </div>
            <div>
              <label className="block mb-1">利用者</label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">利用者を選択してください</option>
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
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!selectedUserId}
            >
              予約する
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">予約一覧</h2>
          <div className="space-y-4">
            {reservations.map((reservation) => (
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
                    <p>利用者: {getUserName(reservation.userId)}</p>
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
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 