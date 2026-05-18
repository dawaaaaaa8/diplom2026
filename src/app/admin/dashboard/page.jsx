'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../lib/api';
import { requireAuth } from '../../lib/auth';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResorts: 0,
    totalBookings: 0,
    pendingOwners: 0,
    pendingResorts: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    if (!requireAuth(router, 'admin')) return;
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Админ Dashboard</h1>
          <p className="text-gray-600 mt-2">Системийн ерөнхий үзүүлэлтүүд</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-gray-600 mt-2">Нийт хэрэглэгч</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalResorts}</div>
            <div className="text-gray-600 mt-2">Нийт амралтын газар</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalBookings}</div>
            <div className="text-gray-600 mt-2">Нийт захиалга</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingOwners}</div>
            <div className="text-gray-600 mt-2">Хүлээгдэж буй эзэмшигчид</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.pendingResorts}</div>
            <div className="text-gray-600 mt-2">Хүлээгдэж буй амралтын газар</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-indigo-600">₮{stats.monthlyRevenue.toLocaleString()}</div>
            <div className="text-gray-600 mt-2">Энэ сарын орлого</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Хурдан үйлдлүүд">
            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={() => router.push('/admin/pending-owners')}>
                Хүлээгдэж буй эзэмшигчид шалгах
              </Button>
              <Button variant="success" fullWidth onClick={() => router.push('/admin/pending-resorts')}>
                Амралтын газар баталгаажуулах
              </Button>
              <Button variant="outline" fullWidth onClick={() => router.push('/admin/users')}>
                Хэрэглэгчдийн жагсаалт
              </Button>
            </div>
          </Card>

          <Card title="Системийн мэдээлэл">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">API статус:</span>
                <span className="text-green-600 font-semibold">Ажиллаж байна</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Сүүлийн шинэчлэл:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}