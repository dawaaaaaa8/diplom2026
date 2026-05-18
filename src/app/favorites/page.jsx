'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (id) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    toast.success('Дуртай жагсаалтаас хасагдлаа');
  };

  const getImageUrl = (resort) => {
    if (resort.image_url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      if (resort.image_url.startsWith('/uploads/')) return `${baseUrl}${resort.image_url}`;
      return resort.image_url;
    }
    return '/images/default-resort.jpg';
  };

  if (!mounted || loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-xl">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Дуртай амралтын газрууд</h1>
              <p className="text-gray-500 mt-1">Таны хадгалсан дуртай амралтын газрууд</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {favorites.length > 0 && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-gray-700">Нийт <span className="font-bold text-red-500">{favorites.length}</span> амралтын газар</span>
            </div>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-16 text-center">
            <div className="text-8xl mb-6">❤️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Дуртай амралтын газар байхгүй байна</h2>
            <p className="text-gray-500 mb-6">Амралтын газруудыг үзэж, дуртай болгон хадгалаарай</p>
            <Link href="/resorts" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Амралтын газар хайх
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((resort) => (
              <div key={resort.id} className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Image Section */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={getImageUrl(resort)}
                    alt={resort.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => e.target.src = '/images/default-resort.jpg'}
                  />
                  {/* Remove Favorite Button */}
                  <button
                    onClick={() => removeFavorite(resort.id)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-2 shadow-md transition-all duration-200 z-10 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* Price Badge */}
                  {resort.price_per_night && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                      ₮{resort.price_per_night.toLocaleString()} / шөнө
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                      {resort.name}
                    </h3>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{resort.city || 'Хаяг байхгүй'}</span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resort.description || 'Тайлбар байхгүй'}
                  </p>
                  
                  {/* Rating and Action */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    {resort.total_rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-sm">⭐</span>
                        <span className="text-sm font-semibold text-gray-700">{resort.total_rating}</span>
                        <span className="text-xs text-gray-400">({resort.review_count})</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Үнэлгээ байхгүй</div>
                    )}
                    <Link
                      href={`/resorts/${resort.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:gap-2 transition-all"
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
      </div>
    </div>
  );
}