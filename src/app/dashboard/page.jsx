'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { bookingAPI, resortAPI, unitAPI } from '../lib/api';
import { requireAuth, getUser } from '../lib/auth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

// Dynamic import for LoadingSpinner to prevent hydration issues
const LoadingSpinner = dynamic(() => import('../../components/ui/LoadingSpinner'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [recommendedResorts, setRecommendedResorts] = useState([]);
  const [featuredResorts, setFeaturedResorts] = useState([]);
  const [filteredResorts, setFilteredResorts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [cities, setCities] = useState([]);
  const [resortTypes, setResortTypes] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showAvailableUnits, setShowAvailableUnits] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (!requireAuth(router)) return;
    setUser(getUser());
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsData, allResortsData, featuredData, typesData] = await Promise.all([
        bookingAPI.getUserBookings().catch(() => ({ data: [] })),
        resortAPI.getAll({ limit: 100 }).catch(() => ({ data: [] })),
        resortAPI.getFeatured(4).catch(() => ({ data: [] })),
        resortAPI.getResortTypes().catch(() => ({ data: [] })),
      ]);
      
      const userBookings = bookingsData.data || [];
      const resorts = allResortsData.data || [];
      
      setBookings(userBookings);
      setRecommendedResorts(resorts.slice(0, 6));
      setFilteredResorts(resorts);
      setFeaturedResorts(featuredData.data || []);
      setResortTypes(typesData.data || []);
      
      const uniqueCities = [...new Set(resorts.map(r => r.city).filter(Boolean))];
      setCities(uniqueCities);
      
      const upcoming = userBookings.filter(
        b => new Date(b.start_date) > new Date() && b.status === 'confirmed'
      ).length;
      
      const completed = userBookings.filter(
        b => new Date(b.end_date) < new Date() && b.status === 'confirmed'
      ).length;
      
      const totalSpent = userBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
      
      setStats({
        totalBookings: userBookings.length,
        upcomingBookings: upcoming,
        completedBookings: completed,
        totalSpent: totalSpent,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // Огноогоор боломжтой өрөөнүүдийг хайх функц
  const searchAvailableRooms = async () => {
    if (!checkInDate || !checkOutDate) {
      toast.error('Ирэх болон буцах огноогоо сонгоно уу');
      return;
    }

    if (new Date(checkInDate) < new Date()) {
      toast.error('Ирэх огноо өнөөдрөөс хойш байх ёстой');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      toast.error('Буцах огноо ирэх огнооноос хойш байх ёстой');
      return;
    }

    setCheckingAvailability(true);
    setShowAvailableUnits(true);
    
    try {
      // Бүх амралтын газруудыг авах
      const resortsData = await resortAPI.getAll({ limit: 100 });
      const allResorts = resortsData.data || [];
      
      // Бүх өрөөнүүдийг шалгах
      const resortsWithAvailableUnits = [];
      
      for (const resort of allResorts) {
        // Амралтын газрын өрөөнүүдийг авах
        const unitsData = await unitAPI.getByResort(resort.id);
        const resortUnits = unitsData.data || [];
        
        // Боломжтой өрөөнүүдийг шалгах
        const availableUnitsList = [];
        
        for (const unit of resortUnits) {
          if (!unit.is_available) continue;
          
          try {
            const availabilityData = await unitAPI.checkAvailability(
              unit.id, 
              checkInDate, 
              checkOutDate
            );
            
            if (availabilityData.data?.available) {
              availableUnitsList.push({
                ...unit,
                resort_name: resort.name,
                resort_city: resort.city,
                resort_image: resort.cover_image || resort.image_url,
                available_count: availabilityData.data.availableCount,
                price_per_night: unit.price_per_night
              });
            }
          } catch (error) {
            console.error(`Error checking unit ${unit.id}:`, error);
          }
        }
        
        if (availableUnitsList.length > 0) {
          resortsWithAvailableUnits.push({
            resort: resort,
            availableUnits: availableUnitsList
          });
        }
      }
      
      setAvailableUnits(resortsWithAvailableUnits);
      
      if (resortsWithAvailableUnits.length === 0) {
        toast.error('Сонгосон хугацаанд боломжтой өрөө байхгүй байна');
      } else {
        toast.success(`${resortsWithAvailableUnits.length} амралтын газарт ${resortsWithAvailableUnits.reduce((sum, r) => sum + r.availableUnits.length, 0)} өрөө боломжтой байна`);
      }
      
    } catch (error) {
      console.error('Error searching available rooms:', error);
      toast.error('Боломжтой өрөө хайхад алдаа гарлаа');
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Filter resorts based on search criteria
  useEffect(() => {
    const filterResorts = async () => {
      try {
        let resorts = await resortAPI.getAll({ limit: 100 });
        let filtered = resorts.data || [];
        
        if (searchTerm) {
          filtered = filtered.filter(resort => 
            resort.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resort.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resort.address?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedCity) {
          filtered = filtered.filter(resort => resort.city === selectedCity);
        }
        
        if (selectedType) {
          filtered = filtered.filter(resort => resort.resort_type_name === selectedType || resort.type === selectedType);
        }
        
        setFilteredResorts(filtered);
      } catch (error) {
        console.error('Error filtering resorts:', error);
      }
    };
    
    filterResorts();
  }, [searchTerm, selectedCity, selectedType]);

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
    return { className: badges[status] || 'bg-gray-100 text-gray-800', label: labels[status] || status };
  };

  const getDisplayImage = (resort) => {
    if (resort.display_image) return resort.display_image;
    if (resort.cover_image) return resort.cover_image;
    if (resort.image_url) return resort.image_url;
    if (resort.images && resort.images.length > 0) return resort.images[0];
    return '/images/default-resort.jpg';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedType('');
    setCheckInDate('');
    setCheckOutDate('');
    setGuests(2);
    setShowAvailableUnits(false);
    setAvailableUnits([]);
  };

  const handleSearch = () => {
    searchAvailableRooms();
  };

  // Don't render anything on server to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
         
        </div>

        {/* ==================== SEARCH SECTION ==================== */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🏨 Амралтын газар хайх</h2>
            
            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Destination */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">📍 ХААН ЯВАХ ВЭ?</label>
                <input
                  type="text"
                  placeholder="Хот, бүс, эсвэл амралтын газар"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Check-in Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">📅 ИРЭХ ОГНОО</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">📅 БУЦАХ ОГНОО</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">👥 ЗОЧДЫН ТОО</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} хүн</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={checkingAvailability}
                  className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {checkingAvailability ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Хайж байна...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      ХАЙХ
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Бүх хот/аймаг</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Бүх төрөл</option>
                {resortTypes.map(type => (
                  <option key={type.id || type.name} value={type.name || type}>
                    {type.name_mn || type.name || type}
                  </option>
                ))}
              </select>

              {(searchTerm || selectedCity || selectedType || checkInDate || checkOutDate) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition flex items-center gap-1 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Цэвэрлэх
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Available Units Results */}
        {showAvailableUnits && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                🏠 Боломжтой өрөөнүүд ({availableUnits.reduce((sum, r) => sum + r.availableUnits.length, 0)})
              </h2>
              <p className="text-gray-500 text-sm">
                {checkInDate && checkOutDate && `${new Date(checkInDate).toLocaleDateString('mn-MN')} - ${new Date(checkOutDate).toLocaleDateString('mn-MN')}`}
              </p>
            </div>

            {availableUnits.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏨</div>
                  <p className="text-gray-500 text-lg">Сонгосон хугацаанд боломжтой өрөө байхгүй байна</p>
                  <p className="text-gray-400 text-sm mt-1">Өөр огноо сонгоод дахин хайна уу</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-8">
                {availableUnits.map((item) => (
                  <div key={item.resort.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {/* Resort Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.resort.name}</h3>
                          <p className="text-gray-500 text-sm">📍 {item.resort.city || item.resort.address}</p>
                        </div>
                        <Link href={`/resorts/${item.resort.id}`} className="text-blue-600 hover:underline text-sm">
                          Дэлгэрэнгүй →
                        </Link>
                      </div>
                    </div>
                    
                    {/* Available Units */}
                    <div className="p-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {item.availableUnits.map((unit) => (
                          <div key={unit.id} className="border rounded-xl p-3 hover:shadow-md transition group">
                            <div className="flex gap-3">
                              <img
                                src={unit.image_url ? (unit.image_url.startsWith('/uploads/') ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${unit.image_url}` : unit.image_url) : '/images/default-unit.jpg'}
                                alt={unit.name}
                                className="w-20 h-20 rounded-lg object-cover"
                                onError={(e) => e.target.src = '/images/default-unit.jpg'}
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                                <p className="text-xs text-gray-500">{unit.type === 'standard' ? '🏨 Стандарт' : unit.type === 'deluxe' ? '✨ Делюкс' : unit.type === 'suite' ? '👑 Сьют' : '🏡 Вилла'}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span>👥 {unit.capacity} хүн</span>
                                  <span>🛏️ {unit.beds} ор</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div>
                                    <span className="text-lg font-bold text-blue-600">₮{unit.price_per_night.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500">/ шөнө</span>
                                  </div>
                                  <Link
                                    href={`/resorts/${item.resort.id}`}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition"
                                  >
                                    Захиалах
                                  </Link>
                                </div>
                                {unit.available_count > 0 && (
                                  <p className="text-xs text-green-600 mt-1">{unit.available_count} өрөө боломжтой</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-blue-600">{stats.totalBookings}</div>
            <div className="text-gray-600 mt-2">Нийт захиалга</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-green-600">{stats.upcomingBookings}</div>
            <div className="text-gray-600 mt-2">Удахгүй болох</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-purple-600">{stats.completedBookings}</div>
            <div className="text-gray-600 mt-2">Дууссан захиалга</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-orange-600">₮{stats.totalSpent.toLocaleString()}</div>
            <div className="text-gray-600 mt-2">Нийт зарцуулсан</div>
          </Card>
        </div>

        {/* Recommended Resorts Grid (only show when not searching) */}
        {!showAvailableUnits && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">🏨 Санал болгох амралтын газрууд</h2>
              <Link href="/resorts" className="text-blue-600 hover:underline text-sm">Бүгдийг харах →</Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedResorts.map((resort) => (
                <div key={resort.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={getDisplayImage(resort)}
                      alt={resort.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => e.target.src = '/images/default-resort.jpg'}
                    />
                    {resort.is_featured && (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full z-10">
                        ⭐ Онцлох
                      </span>
                    )}
                    {resort.total_rating > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>⭐</span>
                        <span>{resort.total_rating}</span>
                        <span className="text-gray-300">({resort.review_count})</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">{resort.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{resort.city || resort.address || 'Хаяг байхгүй'}</span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{resort.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        {resort.discount_price ? (
                          <>
                            <span className="text-lg font-bold text-blue-600">₮{parseFloat(resort.discount_price).toLocaleString()}</span>
                            <span className="text-sm text-gray-400 line-through ml-2">₮{parseFloat(resort.price_per_night).toLocaleString()}</span>
                          </>
                        ) : resort.price_per_night ? (
                          <span className="text-lg font-bold text-blue-600">₮{parseFloat(resort.price_per_night).toLocaleString()}</span>
                        ) : (
                          <span className="text-sm text-gray-500">Үнэ тодорхойгүй</span>
                        )}
                        {resort.price_per_night && <p className="text-xs text-gray-500">/ шөнө</p>}
                      </div>
                      <Link
                        href={`/resorts/${resort.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        Захиалах
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card title="📋 Сүүлийн захиалгууд">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-500">Захиалга байхгүй байна</p>
                <Link href="/resorts" className="text-blue-600 hover:underline mt-2 inline-block">
                  Амралтын газар хайх →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => {
                  const { className, label } = getStatusBadge(booking.status);
                  return (
                    <div key={booking.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl hover:shadow-md transition">
                      <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                        {booking.resort_image ? (
                          <img src={booking.resort_image} alt={booking.resort_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{booking.resort_name}</h4>
                            <p className="text-sm text-gray-500">
                              📅 {new Date(booking.start_date).toLocaleDateString('mn-MN')} - {new Date(booking.end_date).toLocaleDateString('mn-MN')}
                            </p>
                            <p className="text-sm text-gray-500">👥 {booking.guests} зочин</p>
                            <p className="text-sm font-semibold text-blue-600">₮{parseFloat(booking.total_price).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${className}`}>{label}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Link href={`/bookings/${booking.id}`} className="text-xs text-blue-600 hover:underline">
                            Дэлгэрэнгүй
                          </Link>
                          {booking.status === 'pending' && (
                            <button className="text-xs text-red-600 hover:underline">Цуцлах</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {bookings.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/bookings" className="text-blue-600 hover:underline">
                  Бүх захиалгыг харах ({bookings.length}) →
                </Link>
              </div>
            )}
          </Card>

          {/* Featured Resorts */}
          <Card title="⭐ Онцлох амралтын газрууд">
            {featuredResorts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Онцлох амралтын газар байхгүй байна</p>
              </div>
            ) : (
              <div className="space-y-4">
                {featuredResorts.map((resort) => (
                  <div key={resort.id} className="flex gap-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl hover:shadow-md transition">
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                      <img 
                        src={getDisplayImage(resort)} 
                        alt={resort.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = '/images/default-resort.jpg'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{resort.name}</h4>
                        <span className="text-yellow-500 text-sm">⭐</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resort.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">📍 {resort.city || resort.address}</span>
                        <Link href={`/resorts/${resort.id}`} className="text-blue-600 text-sm hover:underline">
                          Дэлгэрэнгүй →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/resorts" className="block">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Амралтын газар хайх</h4>
                <p className="text-sm text-gray-500">Шинэ амралтын газар хайх</p>
              </div>
            </div>
          </Link>
          <Link href="/bookings" className="block">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Миний захиалгууд</h4>
                <p className="text-sm text-gray-500">Захиалгын түүхээ харах</p>
              </div>
            </div>
          </Link>
          <Link href="/favorites" className="block">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Дуртай газрууд</h4>
                <p className="text-sm text-gray-500">Хадгалсан амралтын газрууд</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}