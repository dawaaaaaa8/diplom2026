'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authAPI } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // ✅ Нэвтрэх хуудас ачаалахад хадгалсан захиалга байгаа эсэхийг шалгах
  useEffect(() => {
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      setHasPendingBooking(true);
      try {
        const booking = JSON.parse(pendingBooking);
        console.log('Хадгалсан захиалга байна:', booking);
      } catch (error) {
        console.error('Error parsing pending booking:', error);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Имэйл болон нууц үгээ оруулна уу');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // ✅ Dispatch authChange event to notify Header
        window.dispatchEvent(new Event('authChange'));
        
        toast.success('Амжилттай нэвтэрлээ!');
        
        // ✅ Хадгалсан захиалга байгаа эсэхийг шалгах
        const pendingBooking = localStorage.getItem('pendingBooking');
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        
        if (pendingBooking && redirectUrl) {
          // Хадгалсан захиалга байгаа тул тухайн амралтын газар руу шилжих
          toast.success('Таны хадгалсан захиалга байна!', {
            duration: 3000,
            icon: '📋'
          });
          
          // Хадгалсан мэдээллийг устгахгүй (ResortDetailPage дээр ашиглана)
          // localStorage.removeItem('pendingBooking');
          // localStorage.removeItem('redirectAfterLogin');
          
          router.push(redirectUrl);
        } else {
          // Хадгалсан захиалга байхгүй бол role-оор нь чиглүүлэх
          const userRole = data.data.user?.role_name;
          if (userRole === 'admin') {
            router.push('/admin/dashboard');
          } else if (userRole === 'resort_owner') {
            router.push('/resort_owner/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      toast.error(error.message || 'Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Нэвтрэх
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Эсвэл{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              бүртгүүлэх
            </Link>
          </p>
          {/* ✅ Хадгалсан захиалга байгаа үед мэдэгдэл харуулах */}
          {hasPendingBooking && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                📋 Таны хадгалсан захиалга байна. Нэвтэрсний дараа үргэлжлүүлнэ үү.
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Имэйл хаяг
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Имэйл хаяг"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Нууц үг
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Нууц үг"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                Намайг сана
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Нууц үг мартсан?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Нэвтрэж байна...' : 'Нэвтрэх'}
            </button>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Демо аккаунт</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, email: 'user@test.com', password: '123456' });
              }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Хэрэглэгч (user@test.com / 123456)
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, email: 'owner@test.com', password: '123456' });
              }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Амралтын газар эзэмшигч (owner@test.com / 123456)
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, email: 'admin@test.com', password: 'admin123' });
              }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Админ (admin@test.com / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}