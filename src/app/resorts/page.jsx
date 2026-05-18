'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resortAPI } from '../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ResortsPage() {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [cities, setCities] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Price ranges
  const priceRanges = [
    { value: '', label: 'Бүх үнэ' },
    { value: '0-100000', label: '₮0 - ₮100,000' },
    { value: '100000-300000', label: '₮100,000 - ₮300,000' },
    { value: '300000-500000', label: '₮300,000 - ₮500,000' },
    { value: '500000-1000000', label: '₮500,000 - ₮1,000,000' },
    { value: '1000000+', label: '₮1,000,000 +' },
  ];

  const ratingOptions = [
    { value: '', label: 'Бүх үнэлгээ' },
    { value: '4.5', label: '4.5 ба түүнээс дээш ⭐' },
    { value: '4.0', label: '4.0 ба түүнээс дээш ⭐' },
    { value: '3.5', label: '3.5 ба түүнээс дээш ⭐' },
    { value: '3.0', label: '3.0 ба түүнээс дээш ⭐' },
  ];

  useEffect(() => {
    fetchResorts();
  }, []);

  const fetchResorts = async () => {
    try {
      const data = await resortAPI.getAll({ limit: 100 });
      setResorts(data.data || []);
      
      const uniqueCities = [...new Set((data.data || []).map(r => r.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching resorts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter resorts
  let filteredResorts = resorts.filter(resort => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      resort.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resort.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resort.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // City filter
    const matchesCity = selectedCity === '' || resort.city === selectedCity;
    
    // Price range filter
    let matchesPrice = true;
    if (selectedPriceRange) {
      const price = resort.price_per_night || 0;
      if (selectedPriceRange === '1000000+') {
        matchesPrice = price >= 1000000;
      } else {
        const [min, max] = selectedPriceRange.split('-').map(Number);
        matchesPrice = price >= min && price <= max;
      }
    }
    
    // Custom price range filter
    let matchesCustomPrice = true;
    if (minPrice || maxPrice) {
      const price = resort.price_per_night || 0;
      if (minPrice && price < parseInt(minPrice)) matchesCustomPrice = false;
      if (maxPrice && price > parseInt(maxPrice)) matchesCustomPrice = false;
    }
    
    // Rating filter
    let matchesRating = true;
    if (selectedRating) {
      const rating = resort.total_rating || 0;
      matchesRating = rating >= parseFloat(selectedRating);
    }
    
    return matchesSearch && matchesCity && matchesPrice && matchesCustomPrice && matchesRating;
  });

  // Sort resorts
  filteredResorts = [...filteredResorts].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === 'rating') {
      return (b.total_rating || 0) - (a.total_rating || 0);
    }
    if (sortBy === 'name') {
      return a.name?.localeCompare(b.name);
    }
    if (sortBy === 'price_asc') {
      return (a.price_per_night || 0) - (b.price_per_night || 0);
    }
    if (sortBy === 'price_desc') {
      return (b.price_per_night || 0) - (a.price_per_night || 0);
    }
    return 0;
  });

  const getDisplayImage = (resort) => {
    if (resort.display_image) return resort.display_image;
    if (resort.cover_image) return resort.cover_image;
    if (resort.image_url) return resort.image_url;
    if (resort.images && resort.images.length > 0) return resort.images[0];
    return '/images/default-resort.jpg';
  };

  const formatPrice = (price) => {
    if (!price) return 'Үнэ тодорхойгүй';
    return new Intl.NumberFormat('mn-MN').format(price);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedPriceRange('');
    setSelectedRating('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🏨 Амралтын газрууд
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Монголын шилдэг амралтын газруудыг нэг дор
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 -mt-10 relative z-10">
          {/* Main Search Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Амралтын газар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">🌍 Бүх хот/аймаг</option>
                {cities.map(city => (
                  <option key={city} value={city}>📍 {city}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2 text-gray-600 hover:text-blue-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showFilters ? 'Хаах' : 'Шүүлтүүр'}
            </button>
            {(searchTerm || selectedCity || selectedPriceRange || selectedRating || minPrice || maxPrice) && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Цэвэрлэх
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Price Range Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💰 Үнийн хязгаар</label>
                  <select
                    value={selectedPriceRange}
                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Тодорхой үнэ</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Хамгийн бага"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Хамгийн их"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⭐ Үнэлгээ</label>
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ratingOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Эрэмбэлэх</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="latest">🆕 Сүүлд нэмэгдсэн</option>
                    <option value="rating">⭐ Үнэлгээ</option>
                    <option value="name">📝 Нэр</option>
                    <option value="price_asc">💰 Үнэ: багаас их</option>
                    <option value="price_desc">💰 Үнэ: ихээс бага</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{filteredResorts.length}</span> амралтын газар олдло
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                sortBy === 'latest' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              🆕 Сүүлд нэмэгдсэн
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                sortBy === 'rating' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ⭐ Үнэлгээ
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                sortBy === 'name' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📝 Нэр
            </button>
            <button
              onClick={() => setSortBy('price_asc')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                sortBy === 'price_asc' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              💰 Үнэ: багаас
            </button>
          </div>
        </div>

        {/* Resorts Grid */}
        {filteredResorts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">Амралтын газар олдсонгүй</p>
            <button
              onClick={clearAllFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Бүх амралтын газрыг харах
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResorts.map((resort) => (
              <div key={resort.id} className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden bg-gray-200">
                  <img
                    src={getDisplayImage(resort)}
                    alt={resort.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => e.target.src = '/images/default-resort.jpg'}
                  />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {resort.is_featured && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
                        ⭐ Онцлох
                      </span>
                    )}
                    {resort.resort_type_name && (
                      <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                        {resort.resort_type_name}
                      </span>
                    )}
                  </div>
                  {/* Rating badge */}
                  {resort.total_rating > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-md">
                      <span className="text-yellow-500 text-sm">⭐</span>
                      <span className="font-semibold text-gray-800 text-sm">{resort.total_rating}</span>
                      <span className="text-gray-500 text-xs">({resort.review_count})</span>
                    </div>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition">
                    {resort.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{resort.city || resort.address?.split(',')[0] || 'Хаяг байхгүй'}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resort.description}
                  </p>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div>
                      {resort.discount_price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-500">₮{formatPrice(resort.discount_price)}</span>
                          <span className="text-sm text-gray-400 line-through">₮{formatPrice(resort.price_per_night)}</span>
                        </div>
                      ) : resort.price_per_night ? (
                        <span className="text-lg font-bold text-blue-600">₮{formatPrice(resort.price_per_night)}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Үнэ тодорхойгүй</span>
                      )}
                      {resort.price_per_night && <p className="text-xs text-gray-400">/ шөнө</p>}
                    </div>
                    <Link
                      href={`/resorts/${resort.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1 group-hover:gap-2"
                    >
                      Дэлгэрэнгүй
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Properties Section */}
        {!searchTerm && !selectedCity && !selectedPriceRange && !selectedRating && !minPrice && !maxPrice && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">✨ Онцлох амралтын газрууд</h2>
              <p className="text-gray-500">Таны аялалыг илүү сайхан болгох шилдэг газрууд</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredResorts.filter(r => r.is_featured).slice(0, 4).map((resort) => (
                <div key={resort.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getDisplayImage(resort)}
                      alt={resort.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 text-white">
                      <p className="text-xs font-semibold">{resort.resort_type_name || 'Resort'}</p>
                      <p className="text-sm font-bold">{resort.name}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-sm">⭐</span>
                        <span className="text-sm font-semibold">{resort.total_rating || 'Шинэ'}</span>
                      </div>
                      <Link href={`/resorts/${resort.id}`} className="text-blue-600 text-sm hover:underline">
                        Дэлгэрэнгүй →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}