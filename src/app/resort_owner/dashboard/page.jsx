'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resortAPI, bookingAPI } from '../../lib/api';
import { requireAuth, getUser } from '../../lib/auth';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resorts, setResorts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalResorts: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
  });
  const [ownerStatus, setOwnerStatus] = useState(null);

  useEffect(() => {
    if (!requireAuth(router, 'resort_owner')) return;
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = getUser();
      setOwnerStatus(user?.owner_status);
      
      // Only fetch if approved
      if (user?.owner_status === 'approved') {
        const [resortsData, bookingsData] = await Promise.all([
          resortAPI.getOwnerResorts(),
          bookingAPI.getOwnerBookings().catch(() => ({ data: [] })), // Fallback if endpoint missing
        ]);
        
        setResorts(resortsData.data || []);
        setBookings(bookingsData.data || []);
        
        const pendingBookings = (bookingsData.data || []).filter(b => b.status === 'pending').length;
        const totalRevenue = (bookingsData.data || [])
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
        
        setStats({
          totalResorts: resortsData.data?.length || 0,
          totalBookings: bookingsData.data?.length || 0,
          pendingBookings: pendingBookings,
          totalRevenue: totalRevenue,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Мэдээлэл шинэчлэгдлээ');
  };

  if (loading) return <LoadingSpinner />;

  if (ownerStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <div className="text-center py-12">
              {ownerStatus === 'pending' ? (
                <>
                  <div className="text-yellow-600 text-6xl mb-4">⏳</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Таны бүртгэл баталгаажаагүй байна</h2>
                  <p className="text-gray-600 mb-4">
                    Таны бүртгэлийг админ шалгаж баталгаажуулж байна. Энэ нь 24-48 цаг хүртэл хугацаа шаардаж болно.
                  </p>
                  <p className="text-gray-500 text-sm">Баталгаажсаны дараа та амралтын газраа нэмэх боломжтой болно.</p>
                </>
              ) : (
                <>
                  <div className="text-red-600 text-6xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Таны бүртгэл татгалзсан байна</h2>
                  <p className="text-gray-600">
                    Дэлгэрэнгүй мэдээллийг админтай холбогдож аваарай.
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Эзэмшигчийн Dashboard</h1>
            <p className="text-gray-600 mt-2">Таны амралтын газрууд болон захиалгын тойм</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={handleRefresh} 
            isLoading={refreshing}
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Шинэчлэх
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-blue-600">{stats.totalResorts}</div>
            <div className="text-gray-600 mt-2">Миний амралтын газрууд</div>
            <Link href="/resort_owner/resorts" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
              Дэлгэрэнгүй →
            </Link>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-green-600">{stats.totalBookings}</div>
            <div className="text-gray-600 mt-2">Нийт захиалга</div>
            <Link href="/resort_owner/bookings" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
              Дэлгэрэнгүй →
            </Link>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            <div className="text-gray-600 mt-2">Хүлээгдэж буй захиалга</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-purple-600">₮{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-gray-600 mt-2">Нийт орлого</div>
          </Card>
        </div>

        {/* Resorts and Bookings Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Миний амралтын газрууд">
            {resorts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Амралтын газар байхгүй байна</p>
                <Link href="/resort_owner/resorts/new" className="text-blue-600 hover:underline mt-2 inline-block">
                  + Шинэ амралтын газар нэмэх
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {resorts.slice(0, 5).map((resort) => (
                  <div key={resort.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/resort_owner/resorts/${resort.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                          {resort.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          📊 Захиалга: {resort.booking_count || 0}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resort.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resort.is_approved ? 'Баталгаажсан' : 'Хүлээгдэж буй'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {resorts.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/resort_owner/resorts" className="text-blue-600 hover:underline">
                  Бүх амралтын газрыг харах ({resorts.length}) →
                </Link>
              </div>
            )}
          </Card>

          <Card title="Сүүлийн захиалгууд">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Захиалга байхгүй байна</p>
                <p className="text-sm text-gray-400 mt-2">Шинэ захиалгууд энд харагдах болно</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.resort_name}</p>
                        <p className="text-sm text-gray-600">
                          👤 {booking.user_name} | {booking.guests} зочин
                        </p>
                        <p className="text-sm text-gray-500">
                          📅 {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium text-gray-700">💰 ${booking.total_price}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status === 'confirmed' ? 'Баталгаажсан' :
                           booking.status === 'pending' ? 'Хүлээгдэж буй' : 'Цуцлагдсан'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookings.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/resort_owner/bookings" className="text-blue-600 hover:underline">
                  Бүх захиалгыг харах ({bookings.length}) →
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}