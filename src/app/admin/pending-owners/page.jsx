'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../lib/api';
import { requireAuth } from '../../lib/auth';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function PendingOwnersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!requireAuth(router, 'admin')) return;
    fetchPendingOwners();
  }, []);

  const fetchPendingOwners = async () => {
    try {
      const data = await adminAPI.getPendingOwners();
      setOwners(data.data || []);
    } catch (error) {
      console.error('Error fetching pending owners:', error);
      toast.error('Хүлээгдэж буй эзэмшигчдийн мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await adminAPI.approveOwner(id);
      toast.success('Амралтын газар эзэмшигч амжилттай баталгаажлаа');
      fetchPendingOwners();
    } catch (error) {
      toast.error(error.message || 'Баталгаажуулахад алдаа гарлаа');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await adminAPI.rejectOwner(id);
      toast.success('Хүсэлтийг татгалзлаа');
      fetchPendingOwners();
    } catch (error) {
      toast.error(error.message || 'Татгалзахад алдаа гарлаа');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Хүлээгдэж буй эзэмшигчид</h1>
          <p className="text-gray-600 mt-2">Амралтын газар эзэмшигчээр бүртгүүлсэн хэрэглэгчдийн хүсэлтүүд</p>
        </div>

        {owners.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">Хүлээгдэж буй хүсэлт байхгүй байна</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {owners.map((owner) => (
              <Card key={owner.id}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{owner.company_name || owner.name}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Эзэмшигч:</span> {owner.name}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Имэйл:</span> {owner.email}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Утас:</span> {owner.phone || 'Байхгүй'}
                      </p>
                      {owner.business_registration && (
                        <p className="text-gray-600">
                          <span className="font-medium">Бизнес бүртгэл:</span> {owner.business_registration}
                        </p>
                      )}
                      <p className="text-gray-600">
                        <span className="font-medium">Хаяг:</span> {owner.address}, {owner.city}
                      </p>
                      <p className="text-gray-500 text-sm">
                        <span className="font-medium">Бүртгүүлсэн огноо:</span> {new Date(owner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="success"
                      onClick={() => handleApprove(owner.id)}
                      isLoading={processingId === owner.id}
                    >
                      Баталгаажуулах
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(owner.id)}
                      isLoading={processingId === owner.id}
                    >
                      Татгалзах
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}