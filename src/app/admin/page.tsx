'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdUser = await api.createUser(newUser);
      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '' });
    } catch (error) {
      console.error('ユーザーの作成に失敗しました:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updatedUser = await api.updateUser(editingUser.id, editingUser);
      setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setEditingUser(null);
    } catch (error) {
      console.error('ユーザー情報の更新に失敗しました:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error('ユーザーの削除に失敗しました:', error);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ユーザー管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">新規ユーザー登録</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block mb-1">名前</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">メールアドレス</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              登録
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">ユーザー一覧</h2>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border p-4 rounded shadow-sm">
                {editingUser?.id === user.id ? (
                  <form onSubmit={handleUpdateUser} className="space-y-2">
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, email: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600"
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 