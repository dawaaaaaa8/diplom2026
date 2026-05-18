'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookingAPI, resortAPI } from '../../lib/api';
import { requireAuth, getUser } from '../../lib/auth';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [selectedResort, setSelectedResort] = useState('all');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!requireAuth(router, 'resort_owner')) return;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsData, resortsData] = await Promise.all([
        bookingAPI.getOwnerBookings(),
        resortAPI.getOwnerResorts(),
      ]);
      
      setBookings(bookingsData.data || []);
      setResorts(resortsData.data || []);
      
      // Calculate stats
      const bookingList = bookingsData.data || [];
      const pending = bookingList.filter(b => b.status === 'pending').length;
      const confirmed = bookingList.filter(b => b.status === 'confirmed').length;
      const completed = bookingList.filter(b => b.status === 'completed').length;
      const cancelled = bookingList.filter(b => b.status === 'cancelled').length;
      const totalRevenue = bookingList
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
      
      setStats({
        total: bookingList.length,
        pending,
        confirmed,
        completed,
        cancelled,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    setUpdating(true);
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      toast.success(`Захиалга "${newStatus === 'confirmed' ? 'баталгаажлаа' : newStatus === 'cancelled' ? 'цуцлагдлаа' : 'шинэчлэгдлээ'}"`);
      setShowStatusModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Төлөв шинэчлэхэд алдаа гарлаа');
    } finally {
      setUpdating(false);
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
    let filtered = [...bookings];
    
    // Filter by resort
    if (selectedResort !== 'all') {
      filtered = filtered.filter(b => b.resort_id === parseInt(selectedResort));
    }
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(b => b.status === filter);
    }
    
    return filtered;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('mn-MN').format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('mn-MN');
  };

  if (!mounted || loading) return <LoadingSpinner />;

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📋 Захиалгууд</h1>
          <p className="text-gray-500 mt-1">Таны амралтын газруудын захиалгын жагсаалт</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Нийт</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Хүлээгдэж буй</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Баталгаажсан</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Дууссан</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
            <p className="text-gray-500 text-sm">Цуцлагдсан</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Нийт орлого</p>
            <p className="text-xl font-bold text-purple-600">₮{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Амралтын газар</label>
              <select
                value={selectedResort}
                onChange={(e) => setSelectedResort(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🌍 Бүх амралтын газар</option>
                {resorts.map(resort => (
                  <option key={resort.id} value={resort.id}>
                    🏨 {resort.name} ({resort.booking_count || 0} захиалга)
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Төлөв</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">📋 Бүгд</option>
                <option value="pending">⏳ Хүлээгдэж буй</option>
                <option value="confirmed">✅ Баталгаажсан</option>
                <option value="completed">✔️ Дууссан</option>
                <option value="cancelled">❌ Цуцлагдсан</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">Захиалга байхгүй байна</p>
            <p className="text-gray-400 text-sm mt-1">Шинэ захиалгууд энд харагдах болно</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const { className, label, icon } = getStatusBadge(booking.status);
              const canConfirm = booking.status === 'pending';
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
              const startDate = new Date(booking.start_date);
              const endDate = new Date(booking.end_date);
              const isUpcoming = startDate > new Date();
              
              return (
                <div key={booking.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        {/* Resort and Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{booking.resort_name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${className}`}>
                            <span>{icon}</span>
                            <span>{label}</span>
                          </span>
                          {isUpcoming && booking.status === 'confirmed' && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Удахгүй
                            </span>
                          )}
                        </div>
                        
                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium">{booking.user_name}</span>
                            <span className="text-xs text-gray-400">({booking.user_email})</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm">{booking.user_phone || 'Утас байхгүй'}</span>
                          </div>
                        </div>
                        
                        {/* Booking Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{booking.guests} зочин</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{booking.unit_name || 'Өрөө'}</span>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Нийт үнэ:</span>
                            <span className="text-xl font-bold text-blue-600">₮{formatPrice(booking.total_price)}</span>
                          </div>
                          {booking.special_requests && (
                            <p className="text-gray-500 text-sm mt-2 p-2 bg-gray-50 rounded-lg">
                              💬 {booking.special_requests}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {(canConfirm || canCancel) && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowStatusModal(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Төлөв өөрчлөх
                          </Button>
                        )}
                        <Link href={`/resorts/${booking.resort_id}`} target="_blank">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Харах
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📝 Захиалгын төлөв өөрчлөх</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-semibold">{selectedBooking.resort_name}</p>
              <p className="text-sm text-gray-600 mt-1">
                👤 {selectedBooking.user_name} | {selectedBooking.guests} зочин
              </p>
              <p className="text-sm text-gray-600">
                📅 {formatDate(selectedBooking.start_date)} - {formatDate(selectedBooking.end_date)}
              </p>
              <p className="text-sm font-semibold text-blue-600 mt-1">₮{formatPrice(selectedBooking.total_price)}</p>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600 mb-2">Шинэ төлөв сонгоно уу:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                  disabled={selectedBooking.status === 'confirmed'}
                  className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Баталгаажуулах
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  disabled={selectedBooking.status === 'cancelled'}
                  className="p-3 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Цуцлах
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  disabled={selectedBooking.status === 'completed'}
                  className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✔️ Дуусгах
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'pending')}
                  disabled={selectedBooking.status === 'pending'}
                  className="p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏳ Хүлээгдэж буй
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowStatusModal(false)}>
                Хаах
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}