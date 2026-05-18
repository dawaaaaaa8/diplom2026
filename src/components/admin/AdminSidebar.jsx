"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaTachometerAlt,
  FaHotel,
  FaCalendarAlt,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaPlusCircle,
  FaListAlt,
  FaChartBar,
  FaDollarSign,
  FaHome,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Админ системээс гарлаа");
    router.push("/");
  };

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <FaTachometerAlt />,
    },
    {
      title: "Амралтын газрууд",
      href: "/admin/resorts",
      icon: <FaHotel />,
      submenu: [
        { title: "Бүгдийг харах", href: "/admin/resorts" },
        { title: "Шинээр бүртгэх", href: "/admin/resorts/create" },
        { title: "Баталгаажуулах", href: "/admin/resorts?status=pending" },
      ],
    },
    {
      title: "Захиалгууд",
      href: "/admin/bookings",
      icon: <FaCalendarAlt />,
    },
    {
      title: "Хэрэглэгчид",
      href: "/admin/users",
      icon: <FaUsers />,
    },
    {
      title: "Санхүү",
      href: "/admin/finance",
      icon: <FaDollarSign />,
    },
    {
      title: "Тайлан",
      href: "/admin/reports",
      icon: <FaChartBar />,
    },
    {
      title: "Тохиргоо",
      href: "/admin/settings",
      icon: <FaCog />,
    },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white shadow-xl z-30 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Админ панел</h2>
                <p className="text-xs text-gray-500">Travel Booking</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold">A</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
          >
            {collapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.submenu && item.submenu.some(sub => pathname === sub.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  title={collapsed ? item.title : ''}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span>{item.title}</span>}
                </Link>

                {/* Submenu */}
                {!collapsed && item.submenu && (
                  <ul className="ml-10 mt-2 space-y-1">
                    {item.submenu.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      
                      return (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={`flex items-center space-x-2 px-3 py-2 rounded text-sm ${
                              isSubActive
                                ? "text-blue-600 font-medium"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {subItem.title === "Шинээр бүртгэх" ? (
                              <FaPlusCircle className="text-xs" />
                            ) : (
                              <FaListAlt className="text-xs" />
                            )}
                            <span>{subItem.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Хурдан үйлдлүүд</h3>
            <div className="space-y-2">
              <Link
                href="/admin/resorts/create"
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <FaPlusCircle />
                <span>Шинэ амралтын газар</span>
              </Link>
              <Link
                href="/"
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <FaHome />
                <span>Үндсэн сайт</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 w-full"
              >
                <FaSignOutAlt />
                <span>Гарах</span>
              </button>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mt-8 space-y-2">
            <Link
              href="/admin/resorts/create"
              className="flex justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Шинэ амралтын газар"
            >
              <FaPlusCircle className="text-lg" />
            </Link>
            <Link
              href="/"
              className="flex justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Үндсэн сайт"
            >
              <FaHome className="text-lg" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg w-full"
              title="Гарах"
            >
              <FaSignOutAlt className="text-lg" />
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}