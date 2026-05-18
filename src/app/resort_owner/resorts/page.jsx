'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resortAPI } from '../../lib/api';
import { requireAuth, getUser } from '../../lib/auth';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function OwnerResortsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resorts, setResorts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalBookings: 0,
  });

  useEffect(() => {
    if (!requireAuth(router, 'resort_owner')) return;
    fetchResorts();
  }, []);

  const fetchResorts = async () => {
    try {
      const data = await resortAPI.getOwnerResorts();
      const resortsList = data.data || [];
      setResorts(resortsList);
      
      // Calculate stats
      const approved = resortsList.filter(r => r.is_approved).length;
      const pending = resortsList.filter(r => !r.is_approved).length;
      const totalBookings = resortsList.reduce((sum, r) => sum + (r.booking_count || 0), 0);
      
      setStats({
        total: resortsList.length,
        approved,
        pending,
        totalBookings,
      });
    } catch (error) {
      console.error('Error fetching resorts:', error);
      toast.error('Амралтын газруудын мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayImage = (resort) => {
    if (resort.display_image) return resort.display_image;
    if (resort.cover_image) return resort.cover_image;
    if (resort.image_url) return resort.image_url;
    if (resort.images && resort.images.length > 0) return resort.images[0];
    return '/images/default-resort.jpg';
  };

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return { text: 'Баталгаажсан', className: 'bg-green-100 text-green-800' };
    }
    return { text: 'Хүлээгдэж буй', className: 'bg-yellow-100 text-yellow-800' };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏨 Миний амралтын газрууд</h1>
            <p className="text-gray-500 mt-1">Таны бүртгэлтэй амралтын газруудын жагсаалт</p>
          </div>
          <Link href="/resort_owner/resorts/new">
            <Button variant="primary" className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Шинэ амралтын газар нэмэх
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Нийт амралтын газар</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Баталгаажсан</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Хүлээгдэж буй</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Нийт захиалга</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalBookings}</p>
          </div>
        </div>

        {/* Resorts List */}
        {resorts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏨</div>
              <p className="text-gray-500 text-lg">Амралтын газар байхгүй байна</p>
              <p className="text-gray-400 text-sm mt-1">Шинэ амралтын газар нэмэх товч дарж эхлээрэй</p>
              <Link href="/resort_owner/resorts/new" className="mt-4 inline-block">
                <Button variant="primary">+ Шинэ амралтын газар нэмэх</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {resorts.map((resort) => {
              const status = getStatusBadge(resort.is_approved);
              return (
                <div key={resort.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-48 md:h-auto relative bg-gray-200">
                      <img
                        src={getDisplayImage(resort)}
                        alt={resort.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = '/images/default-resort.jpg'}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{resort.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${status.className}`}>
                              {status.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {resort.city || resort.address?.split(',')[0] || 'Хаяг байхгүй'}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {resort.booking_count || 0} захиалга
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {resort.description}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/resort_owner/resorts/${resort.id}/units`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Өрөөнүүд
                            </Button>
                          </Link>
                          <Link href={`/resort_owner/resorts/${resort.id}/edit`}>
                            <Button variant="secondary" size="sm" className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Засах
                            </Button>
                          </Link>
                          <Link href={`/resorts/${resort.id}`} target="_blank">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}