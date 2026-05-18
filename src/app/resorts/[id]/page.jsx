'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resortAPI, unitAPI, bookingAPI, favoritesAPI, reviewAPI } from '../../lib/api';
import { getUser } from '../../lib/auth';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';





export default function ResortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resortId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [resort, setResort] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [dates, setDates] = useState({ start_date: '', end_date: '' });
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [user, setUser] = useState(null);
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Амралтын газрын зургийн слайдер
  const [resortImages, setResortImages] = useState([]);
  const [currentResortImageIndex, setCurrentResortImageIndex] = useState(0);
  const [showResortImageModal, setShowResortImageModal] = useState(false);
  
  // Өрөөний зургийн слайдер
  const [selectedUnitImages, setSelectedUnitImages] = useState([]);
  const [currentUnitImageIndex, setCurrentUnitImageIndex] = useState(0);
  const [showUnitImageModal, setShowUnitImageModal] = useState(false);
  
  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Review state
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // ==================== HELPER FUNCTIONS ====================
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    if (url.startsWith('/uploads/')) return `${baseUrl}${url}`;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url;
  };

  const getResortAllImages = (resort) => {
    const images = [];
    if (resort?.cover_image) images.push(getImageUrl(resort.cover_image));
    if (resort?.image_url && !images.includes(getImageUrl(resort.image_url))) {
      images.push(getImageUrl(resort.image_url));
    }
    if (resort?.images && Array.isArray(resort.images)) {
      for (const img of resort.images) {
        const imgUrl = getImageUrl(img);
        if (!images.includes(imgUrl)) images.push(imgUrl);
      }
    }
    if (resort?.gallery && Array.isArray(resort.gallery)) {
      for (const img of resort.gallery) {
        const imgUrl = getImageUrl(img.image_url || img);
        if (!images.includes(imgUrl)) images.push(imgUrl);
      }
    }
    if (images.length === 0) images.push('/images/default-resort.jpg');
    return images;
  };

  const getUnitImages = (unit) => {
    const images = [];
    if (unit?.image_url) images.push(getImageUrl(unit.image_url));
    if (unit?.images && Array.isArray(unit.images)) {
      for (const img of unit.images) {
        const imgUrl = getImageUrl(img);
        if (!images.includes(imgUrl)) images.push(imgUrl);
      }
    }
    if (unit?.display_image && !images.includes(getImageUrl(unit.display_image))) {
      images.push(getImageUrl(unit.display_image));
    }
    if (images.length === 0) images.push('/images/default-unit.jpg');
    return images;
  };

  // ==================== DATA FETCHING ====================
  useEffect(() => {
    setUser(getUser());
    fetchData();
    checkIfFavorite();
    fetchReviews();
    
    // Хадгалсан захиалгын мэдээллийг сэргээх
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const booking = JSON.parse(pendingBooking);
        console.log('Хадгалсан захиалга байна:', booking);
        
        // Хэрэглэгчдэд мэдэгдэх
        toast.success('Таны хадгалсан захиалга байна!', {
          duration: 3000,
          icon: '📋'
        });
      } catch (error) {
        console.error('Error parsing pending booking:', error);
      }
    }
  }, [resortId]);

  const fetchData = async () => {
    try {
      const [resortData, unitsData] = await Promise.all([
        resortAPI.getById(resortId),
        unitAPI.getByResort(resortId)
      ]);
      setResort(resortData.data);
      setUnits(unitsData.data || []);
      
      const resortImgList = getResortAllImages(resortData.data);
      setResortImages(resortImgList);
      
      if (unitsData.data?.length > 0) {
        setSelectedUnit(unitsData.data[0]);
        setSelectedUnitImages(getUnitImages(unitsData.data[0]));
      }
      
      // Хадгалсан захиалгын мэдээллийг сэргээх (units ирсэний дараа)
      const pendingBooking = localStorage.getItem('pendingBooking');
      if (pendingBooking && unitsData.data?.length > 0) {
        try {
          const booking = JSON.parse(pendingBooking);
          console.log('Сэргээж буй захиалга:', booking);
          
          // Өрөө сонгох
          if (booking.unitId) {
            const unit = unitsData.data.find(u => u.id === booking.unitId);
            if (unit) {
              setSelectedUnit(unit);
              setSelectedUnitImages(getUnitImages(unit));
            }
          }
          
          // Огноо сэргээх
          if (booking.startDate) {
            setDates({ 
              start_date: booking.startDate, 
              end_date: booking.endDate || '' 
            });
          }
          
          // Зочдын тоо сэргээх
          if (booking.guests) {
            setGuests(booking.guests);
          }
          
          // Тусгай хүсэлт сэргээх
          if (booking.specialRequests) {
            setSpecialRequests(booking.specialRequests);
          }
          
          // Хэрэв огноо байгаа бол автоматаар боломжтой эсэх шалгах
          if (booking.startDate && booking.endDate && booking.unitId) {
            setTimeout(() => {
              checkAvailabilityAfterLogin(booking.unitId, booking.startDate, booking.endDate);
            }, 1000);
          }
          
        } catch (error) {
          console.error('Error parsing pending booking:', error);
        }
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // Нэвтэрсний дараа боломжтой эсэх автомат шалгах
  const checkAvailabilityAfterLogin = async (unitId, startDate, endDate) => {
    setChecking(true);
    try {
      const data = await unitAPI.checkAvailability(unitId, startDate, endDate);
      setAvailability(data.data);
      if (data.data.available) {
        toast.success(`✨ ${data.data.availableCount} өрөө боломжтой байна`);
      } else {
        toast.error('😞 Сонгосон хугацаанд өрөө боломжгүй байна');
      }
    } catch (error) {
      console.error('Check availability error:', error);
      toast.error('Боломжтой эсэхийг шалгахад алдаа гарлаа');
    } finally {
      setChecking(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewAPI.getByResort(resortId);
      setReviews(data.data || []);
      if (user) {
        const userReviewData = await reviewAPI.getUserReview(resortId);
        setUserReview(userReviewData.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkIfFavorite = () => {
    if (resortId) {
      setIsFavorite(favoritesAPI.isFavorite(parseInt(resortId)));
    }
  };

  // ==================== FAVORITE HANDLERS ====================
  const toggleFavorite = () => {
    if (!isAuthenticated()) {
      toast.error('Дуртай жагсаалтад хадгалахын тулд нэвтрэнэ үү');
      router.push('/login');
      return;
    }

    if (isFavorite) {
      favoritesAPI.removeFavorite(parseInt(resortId));
      setIsFavorite(false);
      toast.success('Дуртай жагсаалтаас хасагдлаа');
    } else {
      favoritesAPI.addFavorite({
        id: resort.id,
        name: resort.name,
        description: resort.description,
        city: resort.city,
        price_per_night: resort.price_per_night,
        image_url: resort.cover_image || resort.image_url
      });
      setIsFavorite(true);
      toast.success('Дуртай жагсаалтад хадгалагдлаа');
    }
  };

  // ==================== REVIEW HANDLERS ====================
  const handleSubmitReview = async () => {
    if (!isAuthenticated()) {
      toast.error('Үнэлгээ үлдээхийн тулд нэвтрэнэ үү');
      router.push('/login');
      return;
    }

    if (userReview) {
      toast.error('Та аль хэдийн үнэлгээ үлдээсэн байна');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewAPI.create({
        resort_id: parseInt(resortId),
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('✨ Үнэлгээ амжилттай үлдээлээ!');
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment('');
      fetchReviews();
    } catch (error) {
      toast.error(error.message || 'Үнэлгээ үлдээхэд алдаа гарлаа');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ==================== UNIT SELECTION ====================
  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setSelectedUnitImages(getUnitImages(unit));
    setCurrentUnitImageIndex(0);
    setAvailability(null);
    setDates({ start_date: '', end_date: '' });
  };

  // ==================== AVAILABILITY CHECK ====================
  const checkAvailability = async () => {
    if (!dates.start_date || !dates.end_date) {
      toast.error('Огноо сонгоно уу');
      return;
    }
    if (!selectedUnit) {
      toast.error('Өрөө сонгоно уу');
      return;
    }
    if (new Date(dates.start_date) < new Date()) {
      toast.error('Эхлэх огноо өнөөдрөөс хойш байх ёстой');
      return;
    }
    if (new Date(dates.end_date) <= new Date(dates.start_date)) {
      toast.error('Буцах огноо ирэх огнооноос хойш байх ёстой');
      return;
    }

    setChecking(true);
    try {
      const data = await unitAPI.checkAvailability(selectedUnit.id, dates.start_date, dates.end_date);
      setAvailability(data.data);
      if (data.data.available) {
        toast.success(`✨ ${data.data.availableCount} өрөө боломжтой байна`);
      } else {
        toast.error('😞 Сонгосон хугацаанд өрөө боломжгүй байна');
      }
    } catch (error) {
      toast.error('Боломжтой эсэхийг шалгахад алдаа гарлаа');
    } finally {
      setChecking(false);
    }
  };

  // ==================== BOOKING HANDLERS ====================
  const checkAuthAndOpenModal = () => {
    // Огноо шалгах
    if (!dates.start_date || !dates.end_date) {
      toast.error('Эхлэх болон буцах огноогоо сонгоно уу');
      return;
    }
    
    if (!selectedUnit) {
      toast.error('Өрөө сонгоно уу');
      return;
    }
    
    if (!availability?.available) {
      toast.error('Сонгосон хугацаанд өрөө боломжгүй байна. Өөр огноо сонгоно уу.');
      return;
    }
    
    if (!isAuthenticated()) {
      toast.error('Захиалга хийхийн тулд эхлээд нэвтрэнэ үү!', {
        duration: 4000,
        position: 'top-center',
        icon: '🔐'
      });
      
      // Захиалгын мэдээллийг хадгалах
      const nights = Math.ceil((new Date(dates.end_date) - new Date(dates.start_date)) / (1000 * 60 * 60 * 24));
      const totalPrice = selectedUnit ? selectedUnit.price_per_night * nights : 0;
      
      const bookingData = {
        resortId: resort?.id,
        resortName: resort?.name,
        unitId: selectedUnit?.id,
        unitName: selectedUnit?.name,
        startDate: dates.start_date,
        endDate: dates.end_date,
        guests: guests,
        totalPrice: totalPrice,
        specialRequests: specialRequests,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      localStorage.setItem('redirectAfterLogin', `/resorts/${resortId}`);
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }
    
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    // Давхар шалгалт
    if (!isAuthenticated()) {
      toast.error('Нэвтрэлтийн хугацаа дууссан, дахин нэвтрэнэ үү');
      router.push('/login');
      return;
    }

    if (!availability?.available) {
      toast.error('Сонгосон хугацаанд өрөө боломжгүй байна');
      return;
    }

    const nights = Math.ceil((new Date(dates.end_date) - new Date(dates.start_date)) / (1000 * 60 * 60 * 24));
    const totalPrice = selectedUnit.price_per_night * nights;

    try {
      await bookingAPI.create({
        unit_id: selectedUnit.id,
        start_date: dates.start_date,
        end_date: dates.end_date,
        guests: guests,
        special_requests: specialRequests,
        total_price: totalPrice
      });
      
      // Хадгалсан захиалгыг цэвэрлэх
      localStorage.removeItem('pendingBooking');
      localStorage.removeItem('redirectAfterLogin');
      
      toast.success('✅ Захиалга амжилттай үүсгэгдлээ!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Захиалга хийхэд алдаа гарлаа');
    }
  };

  // ==================== IMAGE MODAL HANDLERS ====================
  const openResortImageModal = (index) => {
    setCurrentResortImageIndex(index);
    setShowResortImageModal(true);
  };

  const openUnitImageModal = (index) => {
    setCurrentUnitImageIndex(index);
    setShowUnitImageModal(true);
  };

  const nextResortImage = () => {
    setCurrentResortImageIndex((prev) => (prev + 1) % resortImages.length);
  };

  const prevResortImage = () => {
    setCurrentResortImageIndex((prev) => (prev - 1 + resortImages.length) % resortImages.length);
  };

  const nextUnitImage = () => {
    setCurrentUnitImageIndex((prev) => (prev + 1) % selectedUnitImages.length);
  };

  const prevUnitImage = () => {
    setCurrentUnitImageIndex((prev) => (prev - 1 + selectedUnitImages.length) % selectedUnitImages.length);
  };

  // ==================== RENDER ====================
  if (loading) return <LoadingSpinner />;
  if (!resort) return <div className="text-center py-12">Амралтын газар олдсонгүй</div>;

  const nights = dates.start_date && dates.end_date 
    ? Math.ceil((new Date(dates.end_date) - new Date(dates.start_date)) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = selectedUnit && nights ? selectedUnit.price_per_night * nights : 0;
  
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Resort Image Slider */}
      <div className="relative h-[60vh] md:h-[70vh] bg-gray-900">
        <div className="relative w-full h-full">
          <img
            src={resortImages[currentResortImageIndex]}
            alt={resort.name}
            className="w-full h-full object-cover"
            onError={(e) => e.target.src = '/images/default-resort.jpg'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        
        {resortImages.length > 1 && (
          <>
            <button onClick={prevResortImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={nextResortImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {resortImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {currentResortImageIndex + 1} / {resortImages.length}
          </div>
        )}
        
        {resortImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 mb-8">
            {resortImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentResortImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition ${currentResortImageIndex === idx ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{resort.name}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span>{averageRating}</span>
                    <span className="text-gray-300">({reviews.length} сэтгэгдэл)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{resort.city || resort.address}</span>
                  </div>
                  {resort.is_featured && (
                    <span className="bg-yellow-500 px-3 py-1 rounded-full text-sm">⭐ Онцлох</span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-full transition ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card title="📝 Амралтын газрын тухай">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{resort.description}</p>
            </Card>

            {/* Available Units */}
            <Card title="🏠 Боломжтой өрөөнүүд">
              {units.filter(u => u.is_available).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Боломжтой өрөө байхгүй байна</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {units.filter(u => u.is_available).map((unit) => {
                    const unitImages = getUnitImages(unit);
                    return (
                      <div
                        key={unit.id}
                        onClick={() => handleSelectUnit(unit)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedUnit?.id === unit.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-32 flex-shrink-0">
                            <div className="relative">
                              <img
                                src={unitImages[0]}
                                alt={unit.name}
                                className="w-32 h-32 rounded-lg object-cover cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUnitImages(unitImages);
                                  setCurrentUnitImageIndex(0);
                                  setShowUnitImageModal(true);
                                }}
                                onError={(e) => e.target.src = '/images/default-unit.jpg'}
                              />
                              {unitImages.length > 1 && (
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {unitImages.length}
                                </div>
                              )}
                            </div>
                            {unitImages.length > 1 && (
                              <div className="flex gap-1 mt-1">
                                {unitImages.slice(0, 3).map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt=""
                                    className="w-8 h-8 rounded object-cover cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUnitImages(unitImages);
                                      setCurrentUnitImageIndex(idx);
                                      setShowUnitImageModal(true);
                                    }}
                                    onError={(e) => e.target.src = '/images/default-unit.jpg'}
                                  />
                                ))}
                                {unitImages.length > 3 && (
                                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                    +{unitImages.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-lg">{unit.name}</h3>
                                <p className="text-gray-500 text-sm">
                                  {unit.type === 'standard' ? '🏨 Стандарт' : 
                                   unit.type === 'deluxe' ? '✨ Делюкс' : 
                                   unit.type === 'suite' ? '👑 Сьют' : 
                                   unit.type === 'family' ? '👨‍👩‍👧‍👦 Гэр бүлийн' : '🏡 Вилла'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-bold text-blue-600">₮{unit.price_per_night.toLocaleString()}</span>
                                <p className="text-xs text-gray-500">/ шөнө</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                              <span>👥 {unit.capacity} хүн</span>
                              <span>🛏️ {unit.beds} ор</span>
                              {unit.bedrooms && <span>🚪 {unit.bedrooms} унтлагын өрөө</span>}
                              {unit.bathrooms && <span>🛁 {unit.bathrooms} угаалгын өрөө</span>}
                            </div>
                            {unit.description && (
                              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{unit.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Amenities */}
            {resort.amenities && resort.amenities.length > 0 && (
              <Card title="✨ Үйлчилгээнүүд">
                <div className="flex flex-wrap gap-2">
                  {resort.amenities.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Location */}
            <Card title="📍 Байршил">
              <p className="text-gray-700">{resort.address}</p>
              {resort.city && <p className="text-gray-500 text-sm mt-1">📌 {resort.city}</p>}
            </Card>

            {/* Reviews Section */}
            <Card title="⭐ Үнэлгээ ба сэтгэгдлүүд">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">{averageRating}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className="w-5 h-5" fill={star <= averageRating ? '#fbbf24' : '#e5e7eb'} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{reviews.length} сэтгэгдэл</p>
                </div>
                {!userReview && user && (
                  <Button variant="primary" onClick={() => setShowReviewModal(true)}>
                    ✍️ Үнэлгээ үлдээх
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Хараахан үнэлгээ байхгүй байна</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {review.user_name?.charAt(0) || 'Х'}
                            </span>
                          </div>
                          <span className="font-medium">{review.user_name || 'Хэрэглэгч'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(star => (
                            <svg key={star} className="w-4 h-4" fill={star <= review.rating ? '#fbbf24' : '#e5e7eb'} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <p className="text-gray-400 text-xs mt-1">{new Date(review.created_at).toLocaleDateString('mn-MN')}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card title="📅 Захиалга хийх" className="mb-6">
                {selectedUnit ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <div className="flex gap-3">
                        <img
                          src={selectedUnitImages[0] || getImageUrl(selectedUnit.image_url)}
                          alt={selectedUnit.name}
                          className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                          onClick={() => {
                            if (selectedUnitImages.length > 0) {
                              setCurrentUnitImageIndex(0);
                              setShowUnitImageModal(true);
                            }
                          }}
                          onError={(e) => e.target.src = '/images/default-unit.jpg'}
                        />
                        <div>
                          <p className="text-sm text-gray-600">Сонгосон өрөө</p>
                          <p className="font-bold text-lg">{selectedUnit.name}</p>
                          <p className="text-blue-600 font-bold">₮{selectedUnit.price_per_night.toLocaleString()} / шөнө</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">📅 Ирэх огноо</label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={dates.start_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDates({ ...dates, start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">📅 Буцах огноо</label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={dates.end_date}
                        min={dates.start_date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDates({ ...dates, end_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">👥 Зочдын тоо</label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} хүн</option>
                        ))}
                      </select>
                    </div>

                    <Button variant="outline" fullWidth onClick={checkAvailability} isLoading={checking}>
                      🔍 Боломжтой эсэх шалгах
                    </Button>

                    {availability && (
                      <div className={`p-3 rounded-lg ${availability.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {availability.available ? (
                            <>
                              <span className="text-green-600 text-xl">✅</span>
                              <div>
                                <p className="font-semibold text-green-700">Боломжтой</p>
                                <p className="text-sm text-green-600">{availability.availableCount} өрөө байна</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-red-600 text-xl">❌</span>
                              <div>
                                <p className="font-semibold text-red-700">Боломжгүй</p>
                                <p className="text-sm text-red-600">Сонгосон хугацаанд өрөө байхгүй</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {nights > 0 && totalPrice > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Шөнийн үнэ:</span>
                          <span>₮{selectedUnit.price_per_night.toLocaleString()} x {nights} шөнө</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                          <span>Нийт үнэ:</span>
                          <span className="text-blue-600">₮{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={checkAuthAndOpenModal}
                      disabled={!availability?.available || !dates.start_date || !dates.end_date}
                    >
                      📝 Захиалах
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Өрөө сонгоно уу</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Resort Image Modal */}
      {showResortImageModal && resortImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowResortImageModal(false)}>
          <div className="relative max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowResortImageModal(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={resortImages[currentResortImageIndex]} alt="Resort gallery" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            {resortImages.length > 1 && (
              <>
                <button onClick={prevResortImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={nextResortImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
              {resortImages.map((img, idx) => (
                <button key={idx} onClick={() => setCurrentResortImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${currentResortImageIndex === idx ? 'border-blue-500' : 'border-gray-600'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="text-center text-white text-sm mt-4">{currentResortImageIndex + 1} / {resortImages.length}</div>
          </div>
        </div>
      )}

      {/* Unit Image Modal */}
      {showUnitImageModal && selectedUnitImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowUnitImageModal(false)}>
          <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUnitImageModal(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={selectedUnitImages[currentUnitImageIndex]} alt="Unit gallery" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            {selectedUnitImages.length > 1 && (
              <>
                <button onClick={prevUnitImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={nextUnitImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
              {selectedUnitImages.map((img, idx) => (
                <button key={idx} onClick={() => setCurrentUnitImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${currentUnitImageIndex === idx ? 'border-blue-500' : 'border-gray-600'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="text-center text-white text-sm mt-4">{currentUnitImageIndex + 1} / {selectedUnitImages.length}</div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📋 Захиалга баталгаажуулах</h2>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between"><span className="text-gray-600">Амралтын газар:</span><span className="font-semibold">{resort.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Өрөө:</span><span className="font-semibold">{selectedUnit?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Ирэх огноо:</span><span>{new Date(dates.start_date).toLocaleDateString('mn-MN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Буцах огноо:</span><span>{new Date(dates.end_date).toLocaleDateString('mn-MN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Шөнийн тоо:</span><span>{nights} шөнө</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Зочдын тоо:</span><span>{guests} хүн</span></div>
              {specialRequests && <div className="flex justify-between"><span className="text-gray-600">Хүсэлт:</span><span className="text-sm">{specialRequests}</span></div>}
              <div className="flex justify-between border-t pt-3 mt-2"><span className="font-bold text-lg">Нийт үнэ:</span><span className="font-bold text-blue-600 text-xl">₮{totalPrice.toLocaleString()}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Нэмэлт хүсэлт</label>
              <textarea className="w-full p-2 border rounded-lg mb-4" rows="2" placeholder="Тусгай хүсэлт байвал бичнэ үү..." value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowBookingModal(false)}>Буцах</Button>
              <Button variant="primary" fullWidth onClick={handleBooking}>✅ Баталгаажуулах</Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">⭐ Үнэлгээ үлдээх</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Үнэлгээ</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="focus:outline-none">
                      <svg className={`w-8 h-8 transition ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Сэтгэгдэл</label>
                <textarea className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="4" placeholder="Таны сэтгэгдэл..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" fullWidth onClick={() => setShowReviewModal(false)}>Цуцлах</Button>
                <Button variant="primary" fullWidth onClick={handleSubmitReview} isLoading={submittingReview}>✨ Үнэлгээ үлдээх</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}