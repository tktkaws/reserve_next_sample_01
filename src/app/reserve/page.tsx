'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Reservation, User, UserId } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

type ViewMode = 'list' | 'week' | 'month';

// モーダルコンポーネント
const ReservationModal = ({ 
  reservation, 
  onClose, 
  onDelete,
  onUpdate,
  getUserName,
  users,
  timeOptions,
  reservations
}: { 
  reservation: Reservation; 
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedReservation: Omit<Reservation, 'id'>) => void;
  getUserName: (userId: string) => string;
  users: User[];
  timeOptions: string[];
  reservations: Reservation[];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReservation, setEditedReservation] = useState<Omit<Reservation, 'id'>>({
    userId: reservation.userId,
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    purpose: reservation.purpose
  });
  const [error, setError] = useState<string>('');

  const isTimeOverlap = (newStart: string, newEnd: string, existingStart: string, existingEnd: string): boolean => {
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  };

  const handleDelete = () => {
    onDelete(reservation.id);
    onClose();
  };

  const handleSave = () => {
    setError('');

    // 時間のバリデーション
    if (editedReservation.startTime >= editedReservation.endTime) {
      setError('終了時間は開始時間より後を選択してください');
      return;
    }

    // 同一時刻の予約チェック（自分以外の予約との重複をチェック）
    const hasOverlap = reservations.some((r) => {
      if (r.id === reservation.id) return false;
      if (r.date !== editedReservation.date) return false;
      return isTimeOverlap(
        editedReservation.startTime,
        editedReservation.endTime,
        r.startTime,
        r.endTime
      );
    });

    if (hasOverlap) {
      setError('選択された時間帯は既に予約が入っています');
      return;
    }

    onUpdate(reservation.id, editedReservation);
    setIsEditing(false);
    onClose();
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">予約編集</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">日付</label>
              <input
                type="date"
                value={editedReservation.date}
                onChange={(e) => setEditedReservation({ ...editedReservation, date: e.target.value })}
                className="w-full p-2 border rounded"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">開始時間</label>
              <select
                value={editedReservation.startTime}
                onChange={(e) => setEditedReservation({ ...editedReservation, startTime: e.target.value })}
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
              <label className="block text-sm text-gray-600 mb-1">終了時間</label>
              <select
                value={editedReservation.endTime}
                onChange={(e) => setEditedReservation({ ...editedReservation, endTime: e.target.value })}
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
              <label className="block text-sm text-gray-600 mb-1">利用者</label>
              <select
                value={editedReservation.userId}
                onChange={(e) => setEditedReservation({ ...editedReservation, userId: e.target.value })}
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
              <label className="block text-sm text-gray-600 mb-1">目的</label>
              <input
                type="text"
                value={editedReservation.purpose}
                onChange={(e) => setEditedReservation({ ...editedReservation, purpose: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">予約詳細</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">日付</p>
            <p className="font-medium">{format(new Date(reservation.date), 'yyyy年MM月dd日(E)', { locale: ja })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">時間</p>
            <p className="font-medium">{reservation.startTime} - {reservation.endTime}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">利用者</p>
            <p className="font-medium">{getUserName(reservation.userId)}</p>
          </div>
          {reservation.purpose && (
            <div>
              <p className="text-sm text-gray-600">目的</p>
              <p className="font-medium">{reservation.purpose}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReservePage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purpose, setPurpose] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<UserId>(null);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

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

  const handleUpdateReservation = async (id: string, updatedReservation: Omit<Reservation, 'id'>) => {
    try {
      const updated = await api.updateReservation(id, updatedReservation);
      setReservations(reservations.map((r) => (r.id === id ? updated : r)));
      setError('');
    } catch (error) {
      console.error('予約の更新に失敗しました:', error);
      setError('予約の更新に失敗しました。もう一度お試しください。');
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

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const handleCloseModal = () => {
    setSelectedReservation(null);
  };

  const renderWeekView = () => {
    const weekReservations = getWeekReservations();
    const timeSlots = Array.from({ length: 37 }, (_, i) => {
      const hour = Math.floor(i / 4) + 9;
      const minute = (i % 4) * 15;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    return (
      <div className="w-full">
        <div className="grid grid-cols-8 gap-0.5">
          {/* ヘッダー行 */}
          <div className="bg-gray-50 p-1">
            <div className="h-8"></div>
          </div>
          {weekReservations.map(({ date }) => (
            <div key={date} className="bg-gray-50 p-1 text-center text-sm font-semibold border-b">
              {format(new Date(date), 'MM/dd(E)', { locale: ja })}
            </div>
          ))}
        </div>
        {/* スクロール可能なコンテンツ領域 */}
        <div className="h-[800px] overflow-y-auto">
          <div className="grid grid-cols-8 gap-0.5">
            {/* 時間列 */}
            <div className="bg-gray-50 p-1">
              {timeSlots.map((time) => (
                <div key={time} className="h-10 border-b text-xs">
                  {time}
                </div>
              ))}
            </div>
            {/* 曜日列 */}
            {weekReservations.map(({ date, reservations }) => (
              <div key={date} className="border rounded">
                <div className="relative">
                  {timeSlots.map((time) => {
                    const reservation = reservations.find(
                      (r) => r.startTime === time
                    );
                    if (reservation) {
                      const duration = timeSlots.indexOf(reservation.endTime) - timeSlots.indexOf(reservation.startTime);
                      return (
                        <div
                          key={reservation.id}
                          className="absolute left-0 right-0 bg-blue-100 border border-blue-300 rounded p-1 text-xs cursor-pointer hover:bg-blue-200"
                          style={{
                            top: `${timeSlots.indexOf(reservation.startTime) * 40}px`,
                            height: `${duration * 40}px`,
                          }}
                          onClick={() => handleReservationClick(reservation)}
                        >
                          <p className="font-medium">{reservation.startTime}-{reservation.endTime}</p>
                          <p>{getUserName(reservation.userId)}</p>
                        </div>
                      );
                    }
                    return <div key={time} className="h-10 border-b"></div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {selectedReservation && (
          <ReservationModal
            reservation={selectedReservation}
            onClose={handleCloseModal}
            onDelete={handleDelete}
            onUpdate={handleUpdateReservation}
            getUserName={getUserName}
            users={users}
            timeOptions={timeOptions}
            reservations={reservations}
          />
        )}
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
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">予約一覧</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
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
      </div>
    </main>
  );
} 