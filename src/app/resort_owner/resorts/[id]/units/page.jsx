'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { unitAPI, resortAPI } from '../../../../lib/api';
import { requireAuth } from '../../../../lib/auth';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function UnitsPage() {
  const router = useRouter();
  const params = useParams();
  const resortId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [resortName, setResortName] = useState('');

  useEffect(() => {
    if (!requireAuth(router, 'resort_owner')) return;
    fetchData();
  }, [resortId]);

  const fetchData = async () => {
    try {
      const [resortData, unitsData] = await Promise.all([
        resortAPI.getById(resortId),
        unitAPI.getByResort(resortId)
      ]);
      setResortName(resortData.data.name);
      setUnits(unitsData.data || []);
      
      // Debug: Log units data
      console.log('Fetched units:', unitsData.data?.map(u => ({ 
        id: u.id, 
        name: u.name, 
        image_url: u.image_url, 
        display_image: u.display_image 
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Та энэ өрөөг устгахдаа итгэлтэй байна уу?')) {
      try {
        await unitAPI.delete(id);
        toast.success('Өрөө амжилттай устгагдлаа');
        fetchData();
      } catch (error) {
        toast.error(error.message || 'Устгахад алдаа гарлаа');
      }
    }
  };

  const getImageUrl = (unit) => {
    const imageUrl = unit.image_url || unit.display_image || null;
    
    if (!imageUrl) {
      return '/images/default-room.jpg';
    }
    
    // If already full URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Backend uploads path
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    if (imageUrl.startsWith('/uploads/')) {
      return `${baseUrl}${imageUrl}`;
    }
    
    if (imageUrl.startsWith('uploads/')) {
      return `${baseUrl}/${imageUrl}`;
    }
    
    return '/images/default-room.jpg';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Link href="/resort_owner/resorts" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
              ← Миний амралтын газрууд
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{resortName}</h1>
            <p className="text-gray-500">Өрөөнүүдийн жагсаалт</p>
          </div>
          <Link href={`/resort_owner/resorts/${resortId}/units/new`}>
            <Button variant="primary" className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Шинэ өрөө нэмэх
            </Button>
          </Link>
        </div>

        {/* Units Grid */}
        {units.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-500 text-lg">Өрөө байхгүй байна</p>
              <p className="text-gray-400 text-sm mt-1">Шинэ өрөө нэмэх товч дарж эхлээрэй</p>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <div key={unit.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={getImageUrl(unit)}
                    alt={unit.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image for ${unit.name}:`, getImageUrl(unit));
                      e.target.src = '/images/default-room.jpg';
                    }}
                  />
                  {!unit.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Боломжгүй
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{unit.name}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {unit.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span>👥 {unit.capacity} хүн</span>
                    <span>🛏️ {unit.beds} ор</span>
                    {unit.size_sqm && <span>📐 {unit.size_sqm}м²</span>}
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                      ₮{unit.price_per_night?.toLocaleString()}
                    </span>
                    <span className="text-gray-500">/ шөнө</span>
                    {unit.discount_price && (
                      <span className="ml-2 text-sm text-gray-400 line-through">
                        ₮{unit.discount_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {unit.description || 'Тайлбар байхгүй'}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link href={`/resort_owner/resorts/${resortId}/units/${unit.id}/edit`} className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth>
                        ✏️ Засах
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(unit.id)}>
                      🗑️ Устгах
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}