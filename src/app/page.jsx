'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { resortAPI } from "./lib/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [featuredResorts, setFeaturedResorts] = useState([]);
  const [allResorts, setAllResorts] = useState([]);
  const [filteredResorts, setFilteredResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredData, allResortsData] = await Promise.all([
        resortAPI.getAll({ featured: true, limit: 6 }),
        resortAPI.getAll({ limit: 100 }),
      ]);
      
      setFeaturedResorts(featuredData.data || []);
      setAllResorts(allResortsData.data || []);
      setFilteredResorts(allResortsData.data || []);
      
      const uniqueCities = [...new Set((allResortsData.data || []).map(r => r.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...allResorts];
    
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
    
    setFilteredResorts(filtered);
  }, [searchTerm, selectedCity, allResorts]);

  const getDisplayImage = (resort) => {
    if (resort.display_image) return resort.display_image;
    if (resort.cover_image) return resort.cover_image;
    if (resort.image_url) return resort.image_url;
    if (resort.images && resort.images.length > 0) return resort.images[0];
    return '/images/default-resort.jpg';
  };

  // ✅ Hydration алдаанаас зайлсхийх
  if (!mounted) {
    return null;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Аялалын Захиалгын Систем
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Шинэ аялал, дурсамж бүртгэх хялбар арга
          </p>
          
        </div>

        {/* Search Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Амралтын газар хайх
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Нэр, тайлбар, хаягаар хайх..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Бүх хот/аймаг</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {(searchTerm || selectedCity) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCity("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Цэвэрлэх
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="max-w-6xl mx-auto mb-4">
          <p className="text-gray-600">{filteredResorts.length} амралтын газар олдло</p>
        </div>

        {/* Resorts Grid with Images */}
        {filteredResorts.length > 0 ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResorts.map((resort) => (
                <div key={resort.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Image Section */}
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
                  
                  {/* Content Section */}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                      {resort.name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{resort.city || resort.address || 'Хаяг байхгүй'}</span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {resort.description}
                    </p>
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
                        Дэлгэрэнгүй
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">Амралтын газар олдсонгүй</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCity("");
              }}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Бүх амралтын газрыг харах
            </button>
          </div>
        )}

        {/* Featured Section (only show when no search/filter) */}
        {!searchTerm && !selectedCity && featuredResorts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              🌟 Онцлох амралтын газрууд
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResorts.map((resort) => (
                <div key={resort.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-yellow-400">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={getDisplayImage(resort)}
                      alt={resort.name}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = '/images/default-resort.jpg'}
                    />
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <span>⭐</span>
                      <span>Онцлох</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{resort.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{resort.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">📍 {resort.city || resort.address}</span>
                      <Link href={`/resorts/${resort.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
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