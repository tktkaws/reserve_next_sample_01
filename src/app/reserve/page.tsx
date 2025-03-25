'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Reservation, User, UserId } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

type ViewMode = 'list' | 'week' | 'month';

export default function ReservePage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purpose, setPurpose] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<UserId>(null);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  const getUserName = (userId: string): string => {
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

  const handleDelete = async (id: string) => {
    try {
      await api.deleteReservation(id);
      setReservations(reservations.filter((r) => r.id !== id));
      setError('');
    } catch (error) {
      console.error('予約の削除に失敗しました:', error);
      setError('予約の削除に失敗しました。もう一度お試しください。');
    }
  };

  // 週の予約を取得
  const getWeekReservations = () => {
    const start = startOfWeek(new Date(selectedDate));
    const end = endOfWeek(new Date(selectedDate));
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      reservations: reservations.filter(r => r.date === format(day, 'yyyy-MM-dd'))
    }));
  };

  // 月の予約を取得
  const getMonthReservations = () => {
    const start = startOfMonth(new Date(selectedDate));
    const end = endOfMonth(new Date(selectedDate));
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      isCurrentMonth: isSameMonth(day, new Date(selectedDate)),
      reservations: reservations.filter(r => r.date === format(day, 'yyyy-MM-dd'))
    }));
  };

  const renderReservationList = () => (
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
  );

  const renderWeekView = () => {
    const weekReservations = getWeekReservations();
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekReservations.map(({ date, reservations }) => (
          <div key={date} className="border p-2 rounded">
            <div className="font-semibold mb-2">
              {format(new Date(date), 'MM/dd(E)', { locale: ja })}
            </div>
            <div className="space-y-2">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="text-sm bg-blue-50 p-1 rounded">
                  <p>{reservation.startTime}-{reservation.endTime}</p>
                  <p>{getUserName(reservation.userId)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthReservations = getMonthReservations();
    return (
      <div className="grid grid-cols-7 gap-2">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className="font-semibold text-center p-2">
            {day}
          </div>
        ))}
        {monthReservations.map(({ date, isCurrentMonth, reservations }) => (
          <div
            key={date}
            className={`border p-2 rounded min-h-[100px] ${
              !isCurrentMonth ? 'bg-gray-50' : ''
            }`}
          >
            <div className="font-semibold mb-2">
              {format(new Date(date), 'd')}
            </div>
            <div className="space-y-1">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="text-xs bg-blue-50 p-1 rounded">
                  <p>{reservation.startTime}-{reservation.endTime}</p>
                  <p>{getUserName(reservation.userId)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handlePreviousPeriod = () => {
    const currentDate = new Date(selectedDate);
    let newDate: Date;
    
    if (viewMode === 'week') {
      newDate = subWeeks(currentDate, 1);
    } else {
      newDate = subMonths(currentDate, 1);
    }
    
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const handleNextPeriod = () => {
    const currentDate = new Date(selectedDate);
    let newDate: Date;
    
    if (viewMode === 'week') {
      newDate = addWeeks(currentDate, 1);
    } else {
      newDate = addMonths(currentDate, 1);
    }
    
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const getCurrentPeriodLabel = () => {
    const date = new Date(selectedDate);
    if (viewMode === 'week') {
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      return `${format(start, 'MM/dd')} - ${format(end, 'MM/dd')}`;
    } else {
      return format(date, 'yyyy年MM月');
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
                onChange={(e) => setSelectedUserId(e.target.value || null)}
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
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  リスト表示
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded ${
                    viewMode === 'week'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  週表示
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded ${
                    viewMode === 'month'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  月表示
                </button>
              </div>
              {(viewMode === 'week' || viewMode === 'month') && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePreviousPeriod}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    ←
                  </button>
                  <span className="font-semibold">{getCurrentPeriodLabel()}</span>
                  <button
                    onClick={handleNextPeriod}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    →
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    今日
                  </button>
                </div>
              )}
            </div>
          </div>
          {viewMode === 'list' && renderReservationList()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </div>
      </div>
    </main>
  );
} 