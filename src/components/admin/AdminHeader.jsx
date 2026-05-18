"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function AdminHeader({ user }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    { id: 1, text: "Шинэ захиалга ирлээ", time: "5 мин өмнө", unread: true },
    { id: 2, text: "Хэрэглэгч бүртгэгдлээ", time: "1 цаг өмнө", unread: true },
    { id: 3, text: "Үнэлгээ нэмэгдлээ", time: "2 цаг өмнө", unread: false },
    { id: 4, text: "Систем шинэчлэлт", time: "1 өдөр өмнө", unread: false },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="fixed top-0 right-0 left-64 bg-white shadow-sm border-b z-20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <button type="submit" className="absolute right-3 top-2 text-gray-400 hover:text-blue-600">
              ↵
            </button>
          </form>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border">
                  <div className="p-4 border-b">
                    <h3 className="font-bold text-gray-800">Мэдэгдэл</h3>
                    <p className="text-sm text-gray-500">{notifications.length} шинэ мэдэгдэл</p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          notification.unread ? "bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          setShowNotifications(false);
                          toast.success(notification.text);
                        }}
                      >
                        <p className="font-medium">{notification.text}</p>
                        <p className="text-sm text-gray-500">{notification.time}</p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/admin/notifications");
                      }}
                      className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Бүгдийг харах
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-medium text-gray-800">{user?.name || "Админ"}</p>
              <p className="text-xs text-gray-500">Админ хэрэглэгч</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}