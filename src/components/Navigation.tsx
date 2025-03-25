'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex gap-4">
          <Link
            href="/reserve"
            className={`px-4 py-2 rounded ${
              pathname === '/reserve' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
          >
            予約
          </Link>
          <Link
            href="/admin"
            className={`px-4 py-2 rounded ${
              pathname === '/admin' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
          >
            ユーザー管理
          </Link>
        </div>
      </div>
    </nav>
  );
} 