"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  FaUser, 
  FaBell, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaHotel, 
  FaCalendarAlt, 
  FaHeart, 
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaEnvelope,
  FaBuilding,
  FaChartLine,
  FaUsers,
  FaCheckCircle
} from "react-icons/fa";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    updateLoginStatus();
    
    // Listen for storage changes (when login/logout happens in another tab)
    window.addEventListener('storage', updateLoginStatus);
    
    // Custom event for login/logout from same tab
    window.addEventListener('authChange', updateLoginStatus);
    
    return () => {
      window.removeEventListener('storage', updateLoginStatus);
      window.removeEventListener('authChange', updateLoginStatus);
    };
  }, []);

  const updateLoginStatus = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserName(user.name || "Хэрэглэгч");
        setUserEmail(user.email || "");
        setUserRole(user.role_name || "user");
      } catch (error) {
        setIsLoggedIn(false);
        setUserName("");
        setUserEmail("");
        setUserRole("");
      }
    } else {
      setIsLoggedIn(false);
      setUserName("");
      setUserEmail("");
      setUserRole("");
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Update state
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setUserRole("");
    setShowDropdown(false);
    setIsMenuOpen(false);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new Event('authChange'));
    
    // Redirect to home page without refresh
    router.push("/");
  };

  // Dynamic navigation based on user role
  const getNavItems = () => {
    const commonItems = [
      { href: "/resorts", label: "Амралтын газрууд", icon: <FaHotel /> },
    ];

    switch (userRole) {
      case 'admin':
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: <FaChartLine /> },
          { href: "/admin/pending-owners", label: "Хүлээгдэж буй эзэмшигчид", icon: <FaUsers /> },
          { href: "/admin/resorts", label: "Амралтын газрууд", icon: <FaHotel /> },
          ...commonItems,
        ];
      
      case 'resort_owner':
        return [
          { href: "/resort_owner/dashboard", label: "Dashboard", icon: <FaChartLine /> },
          { href: "/resort_owner/resorts", label: "Миний амралтын газрууд", icon: <FaBuilding /> },
          { href: "/resort_owner/bookings", label: "Захиалгууд", icon: <FaCalendarAlt /> },
          ...commonItems,
        ];
      
      default: // regular user
        return [
          { href: "/dashboard", label: "Нүүр", icon: <FaHome /> },
          ...commonItems,
          { href: "/bookings", label: "Миний захиалгууд", icon: <FaCalendarAlt /> },
          { href: "/favorites", label: "Дуртай", icon: <FaHeart /> },
        ];
    }
  };

  // Get dashboard link for dropdown menu
  const getDashboardLink = () => {
    switch (userRole) {
      case 'admin':
        return "/admin/dashboard";
      case 'resort_owner':
        return "/resort_owner/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return "bg-purple-100 text-purple-800";
      case 'resort_owner':
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin':
        return "Админ";
      case 'resort_owner':
        return "Амралтын газар эзэмшигч";
      default:
        return "Хэрэглэгч";
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">НН</span>
            </div>
            <span className="text-xl font-bold text-gray-800 hidden md:block">
              Налъя Налъя 
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "text-blue-600 bg-blue-50 font-medium"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaBell className="text-xl" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {/* User Profile */}
                <div className="relative">
                  <button 
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="font-medium text-gray-800">{userName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[120px]">{userEmail}</p>
                    </div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                      />
                      
                      {/* Dropdown */}
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{userName}</p>
                              <div className="flex items-center text-gray-500 text-sm">
                                <FaEnvelope className="mr-1 text-xs" />
                                <span className="truncate max-w-[160px]">{userEmail}</span>
                              </div>
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}>
                                  {getRoleDisplayName()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link 
                            href={getDashboardLink()} 
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaUserCircle className="mr-3 text-lg text-blue-500" />
                            <span>Dashboard</span>
                          </Link>
                          
                          <Link 
                            href="/profile" 
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaUser className="mr-3 text-lg text-blue-500" />
                            <span>Профайл</span>
                          </Link>
                          
                          <Link 
                            href="/settings" 
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaCog className="mr-3 text-lg text-blue-500" />
                            <span>Тохиргоо</span>
                          </Link>

                          {/* Role-specific links */}
                          {userRole === 'resort_owner' && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <Link 
                                href="/resort_owner/resorts/new" 
                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <FaBuilding className="mr-3 text-lg text-green-500" />
                                <span>Шинэ амралтын газар нэмэх</span>
                              </Link>
                            </>
                          )}

                          {userRole === 'admin' && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <Link 
                                href="/admin/pending-owners" 
                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <FaUsers className="mr-3 text-lg text-purple-500" />
                                <span>Хүлээгдэж буй хүсэлтүүд</span>
                              </Link>
                              <Link 
                                href="/admin/resorts" 
                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <FaCheckCircle className="mr-3 text-lg text-purple-500" />
                                <span>Амралтын газар баталгаажуулах</span>
                              </Link>
                            </>
                          )}

                          {/* Divider */}
                          <div className="border-t border-gray-100 my-1"></div>

                          {/* Logout Button */}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <FaSignOutAlt className="mr-3 text-lg" />
                            <span>Гарах</span>
                          </button>
                        </div>

                        {/* Status Badge */}
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Статус:</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Нэвтэрсэн
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Нэвтрэх
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-md transition-all"
                >
                  Бүртгүүлэх
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t mt-2 py-4">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg mx-1 ${
                    pathname === item.href
                      ? "text-blue-600 bg-blue-50 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isLoggedIn ? (
                <>
                  {/* User Info */}
                  <div className="mx-1 px-4 py-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{userName}</p>
                        <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}>
                          {getRoleDisplayName()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Menu Items */}
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUserCircle className="text-blue-500" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUser className="text-blue-500" />
                    <span>Профайл</span>
                  </Link>
                  
                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaCog className="text-blue-500" />
                    <span>Тохиргоо</span>
                  </Link>

                  {/* Role-specific mobile links */}
                  {userRole === 'resort_owner' && (
                    <Link
                      href="/resort_owner/resorts/new"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaBuilding className="text-green-500" />
                      <span>Шинэ амралтын газар</span>
                    </Link>
                  )}

                  {/* Mobile Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg mx-1 text-left"
                  >
                    <FaSignOutAlt />
                    <span>Гарах</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg mx-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUser />
                    <span>Нэвтрэх</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg mx-1 justify-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Бүртгүүлэх</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}