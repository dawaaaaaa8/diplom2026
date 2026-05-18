'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminAPI, resortAPI } from '../../lib/api';
import { requireAuth } from '../../lib/auth';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function PendingResortsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resorts, setResorts] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [selectedResort, setSelectedResort] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!requireAuth(router, 'admin')) return;
    fetchPendingResorts();
  }, [router]);

  const fetchPendingResorts = async () => {
    try {
      const data = await adminAPI.getPendingResorts();
      setResorts(data.data || []);
    } catch (error) {
      console.error('Error fetching pending resorts:', error);
      toast.error('Хүлээгдэж буй амралтын газруудын мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await adminAPI.approveResort(id);
      toast.success('Амралтын газар амжилттай баталгаажлаа');
      fetchPendingResorts();
    } catch (error) {
      toast.error(error.message || 'Баталгаажуулахад алдаа гарлаа');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Та энэ амралтын газрыг татгалзахдаа итгэлтэй байна уу?')) return;
    
    setProcessingId(id);
    try {
      await adminAPI.rejectResort(id);
      toast.success('Амралтын газрын хүсэлтийг татгалзлаа');
      fetchPendingResorts();
    } catch (error) {
      toast.error(error.message || 'Татгалзахад алдаа гарлаа');
    } finally {
      setProcessingId(null);
    }
  };

  const viewDetails = (resort) => {
    setSelectedResort(resort);
    setShowDetailModal(true);
  };

  const getStatusBadge = (isApproved) => {
    if (isApproved === true) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Баталгаажсан</span>;
    } else if (isApproved === false) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Хүлээгдэж буй</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Тодорхойгүй</span>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Хүлээгдэж буй амралтын газрууд</h1>
          </div>
          <p className="text-gray-600 ml-11">Баталгаажуулаагүй амралтын газруудыг хянаж баталгаажуулах</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{resorts.length}</div>
            <div className="text-gray-600 mt-2">Хүлээгдэж буй</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {resorts.filter(r => r.owner_name).length}
            </div>
            <div className="text-gray-600 mt-2">Эзэмшигч</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {new Date().toLocaleDateString('mn-MN')}
            </div>
            <div className="text-gray-600 mt-2">Огноо</div>
          </Card>
        </div>

        {/* Resorts List */}
        {resorts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-500 text-lg">Хүлээгдэж буй амралтын газар байхгүй байна</p>
              <p className="text-gray-400 text-sm mt-2">Бүх амралтын газрууд баталгаажсан байна</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {resorts.map((resort) => (
              <Card key={resort.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Resort Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{resort.name}</h3>
                      {getStatusBadge(resort.is_approved)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm">Эзэмшигч: {resort.owner_name || 'Тодорхойгүй'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{resort.email || 'Имэйл байхгүй'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{resort.city || resort.address || 'Хаяг байхгүй'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">Нэмсэн: {new Date(resort.created_at).toLocaleDateString('mn-MN')}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm mt-3 line-clamp-2">{resort.description}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewDetails(resort)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Дэлгэрэнгүй
                    </Button>
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => handleApprove(resort.id)}
                      isLoading={processingId === resort.id}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Баталгаажуулах
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleReject(resort.id)}
                      isLoading={processingId === resort.id}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Татгалзах
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedResort && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Амралтын газрын дэлгэрэнгүй мэдээлэл</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Нэр</p>
                  <p className="font-semibold">{selectedResort.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Статус</p>
                  {getStatusBadge(selectedResort.is_approved)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Эзэмшигч</p>
                  <p className="font-semibold">{selectedResort.owner_name || 'Тодорхойгүй'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Имэйл</p>
                  <p className="font-semibold">{selectedResort.email || 'Байхгүй'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Утас</p>
                  <p className="font-semibold">{selectedResort.phone || 'Байхгүй'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Хаяг</p>
                  <p className="font-semibold">{selectedResort.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Хот/Аймаг</p>
                  <p className="font-semibold">{selectedResort.city || 'Байхгүй'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Нэмсэн огноо</p>
                  <p className="font-semibold">{new Date(selectedResort.created_at).toLocaleString('mn-MN')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Тайлбар</p>
                  <p className="text-gray-700">{selectedResort.description}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="success" fullWidth onClick={() => { handleApprove(selectedResort.id); setShowDetailModal(false); }}>
                  Баталгаажуулах
                </Button>
                <Button variant="danger" fullWidth onClick={() => { handleReject(selectedResort.id); setShowDetailModal(false); }}>
                  Татгалзах
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}