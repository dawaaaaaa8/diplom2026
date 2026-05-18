'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookingAPI, resortAPI } from '../lib/api';
import { requireAuth, getUser } from '../lib/auth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!requireAuth(router)) return;
    setUser(getUser());
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingAPI.getUserBookings();
      setBookings(data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Захиалгын мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setCancelling(true);
    try {
      await bookingAPI.cancel(selectedBooking.id);
      toast.success('Захиалга амжилттай цуцлагдлаа');
      setShowCancelModal(false);
      fetchBookings();
    } catch (error) {
      toast.error(error.message || 'Захиалга цуцлахад алдаа гарлаа');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      confirmed: 'Баталгаажсан',
      pending: 'Хүлээгдэж буй',
      cancelled: 'Цуцлагдсан',
      completed: 'Дууссан',
    };
    const icons = {
      confirmed: '✅',
      pending: '⏳',
      cancelled: '❌',
      completed: '✔️',
    };
    return { 
      className: badges[status] || 'bg-gray-100 text-gray-800', 
      label: labels[status] || status,
      icon: icons[status] || '📋'
    };
  };

  const getFilteredBookings = () => {
    const now = new Date();
    switch (filter) {
      case 'active':
        return bookings.filter(b => 
          new Date(b.end_date) >= now && b.status !== 'cancelled'
        );
      case 'past':
        return bookings.filter(b => 
          new Date(b.end_date) < now || b.status === 'completed'
        );
      case 'pending':
        return bookings.filter(b => b.status === 'pending');
      default:
        return bookings;
    }
  };

  const getBookingImage = (booking) => {
    if (booking.resort_image) return booking.resort_image;
    if (booking.cover_image) return booking.cover_image;
    return '/images/default-resort.jpg';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('mn-MN').format(price);
  };

  if (!mounted || loading) return <LoadingSpinner />;

  const filteredBookings = getFilteredBookings();
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => new Date(b.end_date) >= new Date() && b.status !== 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed' || new Date(b.end_date) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📋 Миний захиалгууд</h1>
          <p className="text-gray-500 mt-1">Таны бүх захиалгын түүх</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Нийт захиалга</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Идэвхтэй</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Хүлээгдэж буй</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Дууссан</p>
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            📋 Бүгд ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'active' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ✅ Идэвхтэй ({stats.active})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ⏳ Хүлээгдэж буй ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'past' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            📅 Дууссан ({stats.completed})
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 text-lg">Захиалга байхгүй байна</p>
            <p className="text-gray-400 text-sm mt-1">Амралтын газар хайж захиалга хийгээрэй</p>
            <Link href="/resorts" className="mt-4 inline-block">
              <Button variant="primary">🏨 Амралтын газар хайх</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const { className, label, icon } = getStatusBadge(booking.status);
              const startDate = new Date(booking.start_date);
              const endDate = new Date(booking.end_date);
              const isActive = endDate >= new Date() && booking.status !== 'cancelled';
              const canCancel = booking.status === 'pending' || (booking.status === 'confirmed' && startDate > new Date());
              
              return (
                <div key={booking.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-48 md:h-auto relative bg-gray-200">
                      <img
                        src={getBookingImage(booking)}
                        alt={booking.resort_name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = '/images/default-resort.jpg'}
                      />
                      {isActive && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            Идэвхтэй
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{booking.resort_name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${className}`}>
                              <span>{icon}</span>
                              <span>{label}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm">
                                {startDate.toLocaleDateString('mn-MN')} - {endDate.toLocaleDateString('mn-MN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm">{booking.guests} зочин</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-semibold text-blue-600">₮{formatPrice(booking.total_price)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-sm">{booking.unit_name || 'Өрөө'}</span>
                            </div>
                          </div>
                          
                          {booking.special_requests && (
                            <p className="text-gray-500 text-sm mt-3 p-2 bg-gray-50 rounded-lg">
                              💬 {booking.special_requests}
                            </p>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/resorts/${booking.resort_id}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Дэлгэрэнгүй
                            </Button>
                          </Link>
                          
                          {canCancel && (
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowCancelModal(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Цуцлах
                            </Button>
                          )}
                          
                          {booking.status === 'completed' && !booking.has_review && (
                            <Link href={`/resorts/${booking.resort_id}#review`}>
                              <Button variant="primary" size="sm" className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Үнэлэх
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Захиалга цуцлах</h2>
              <p className="text-gray-500 mt-2">
                Та дараах захиалгыг цуцлахдаа итгэлтэй байна уу?
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-semibold">{selectedBooking.resort_name}</p>
              <p className="text-sm text-gray-600 mt-1">
                📅 {new Date(selectedBooking.start_date).toLocaleDateString('mn-MN')} - {new Date(selectedBooking.end_date).toLocaleDateString('mn-MN')}
              </p>
              <p className="text-sm text-gray-600">👥 {selectedBooking.guests} зочин</p>
              <p className="text-sm font-semibold text-blue-600 mt-1">₮{formatPrice(selectedBooking.total_price)}</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowCancelModal(false)}>
                Буцах
              </Button>
              <Button variant="danger" fullWidth onClick={handleCancelBooking} isLoading={cancelling}>
                {cancelling ? 'Цуцлаж байна...' : 'Тийм, цуцлах'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}