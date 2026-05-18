// components/Navigation.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navigation() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <Link href="/" className="font-bold text-xl">Амралт.мн</Link>
            
            {user && (
              <>
                {user.role === 'admin' ? (
                  <Link 
                    href="/admin" 
                    className={`${pathname === '/admin' ? 'text-blue-600' : 'text-gray-700'}`}
                  >
                    Админ панел
                  </Link>
                ) : (
                  <Link 
                    href="/dashboard" 
                    className={`${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-700'}`}
                  >
                    Миний самбар
                  </Link>
                )}
                
                <Link href="/resorts" className="text-gray-700">Амралтын газрууд</Link>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">{user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Гарах
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                Нэвтрэх
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}