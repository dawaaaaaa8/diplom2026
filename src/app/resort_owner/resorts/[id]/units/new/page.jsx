'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { unitAPI, resortAPI, uploadAPI } from '../../../../../lib/api';
import { requireAuth, getUser } from '../../../../../lib/auth';
import Card from '../../../../../../components/ui/Card';
import Button from '../../../../../../components/ui/Button';
import LoadingSpinner from '../../../../../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function NewUnitPage() {
  const router = useRouter();
  const params = useParams();
  const resortId = params.id;
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resortName, setResortName] = useState('');
  const [previewImages, setPreviewImages] = useState([]); // Олон зургийн preview
  const [mainImageIndex, setMainImageIndex] = useState(0); // Гол зураг
  
  const [formData, setFormData] = useState({
    resort_id: resortId,
    name: '',
    type: 'standard',
    capacity: 2,
    beds: 1,
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: '',
    price_per_night: '',
    discount_price: '',
    description: '',
    amenities: [],
    images: [], // Олон зургийн URL-ууд
    quantity: 1,
    is_available: true,
  });
  
  const [amenitiesInput, setAmenitiesInput] = useState('');

  // Өрөөний төрлүүд
  const unitTypes = [
    { value: 'standard', label: '🏨 Стандарт', icon: '🛏️' },
    { value: 'deluxe', label: '✨ Делюкс', icon: '🌟' },
    { value: 'suite', label: '👑 Сьют', icon: '👑' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Гэр бүлийн', icon: '👪' },
    { value: 'villa', label: '🏡 Вилла', icon: '🏡' },
  ];

  useEffect(() => {
    if (!requireAuth(router, 'resort_owner')) return;
    fetchResortInfo();
  }, [resortId]);

  const fetchResortInfo = async () => {
    try {
      const data = await resortAPI.getById(resortId);
      setResortName(data.data.name);
    } catch (error) {
      console.error('Error fetching resort:', error);
      toast.error('Амралтын газрын мэдээлэл авахад алдаа гарлаа');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file size (max 5MB each)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Зургийн хэмжээ 5MB-с бага байх ёстой');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Зөвхөн зураг файл оруулна уу');
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      // Create local previews and upload
      const newPreviews = [];
      const newImageUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Local preview
        const reader = new FileReader();
        const previewUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        newPreviews.push(previewUrl);
        
        // Upload to server
        const result = await uploadAPI.uploadImage(file, 'unit');
        newImageUrls.push(result.data.url);
        
        // Update progress
        setUploadProgress(Math.floor(((i + 1) / files.length) * 100));
      }
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setPreviewImages(prev => [...prev, ...newPreviews]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls]
      }));
      
      toast.success(`${files.length} зураг амжилттай хуулагдлаа`);
      setUploadProgress(0);
    } catch (error) {
      clearInterval(interval);
      console.error('Upload error:', error);
      toast.error('Зураг хуулахад алдаа гарлаа');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
    toast.success('Зураг хасагдлаа');
  };

  const setAsMainImage = (index) => {
    setMainImageIndex(index);
    toast.success('Гол зураг болгон сонгогдлоа');
  };

  const addAmenity = () => {
    if (amenitiesInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenitiesInput.trim()]
      }));
      setAmenitiesInput('');
    }
  };

  const removeAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Өрөөний нэр оруулна уу');
      return;
    }
    
    if (!formData.price_per_night) {
      toast.error('Үнэ оруулна уу');
      return;
    }
    
    if (formData.price_per_night <= 0) {
      toast.error('Үнэ 0-с их байх ёстой');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        resort_id: parseInt(resortId),
        name: formData.name,
        type: formData.type,
        capacity: parseInt(formData.capacity),
        beds: parseInt(formData.beds),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null,
        price_per_night: parseFloat(formData.price_per_night),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        description: formData.description,
        amenities: formData.amenities,
        images: formData.images, // Олон зургийн URL-ууд
        image_url: formData.images[mainImageIndex] || null, // Гол зургийг image_url болгож илгээх
        quantity: parseInt(formData.quantity),
        is_available: formData.is_available,
      };
      
      await unitAPI.create(submitData);
      toast.success(`✅ Өрөө амжилттай нэмэгдлээ! (${formData.images.length} зураг)`);
      router.push(`/resort_owner/resorts/${resortId}/units`);
    } catch (error) {
      console.error('Create unit error:', error);
      toast.error(error.message || 'Өрөө нэмэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <p className="text-sm text-gray-500">{resortName}</p>
              <h1 className="text-3xl font-bold text-gray-900">➕ Шинэ өрөө нэмэх</h1>
            </div>
          </div>
          <p className="text-gray-500 ml-11">Өрөөний бүрэн мэдээллийг оруулна уу</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="mb-6 border-0 shadow-lg">
            <div className="space-y-5">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏷️ Өрөөний нэр <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Жишээ: Deluxe Ocean View"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎯 Өрөөний төрөл
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {unitTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-2xl">{type.icon}</div>
                      <div className="text-xs font-medium mt-1">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity & Beds */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👥 Хүний тоо
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🛏️ Орны тоо
                  </label>
                  <input
                    type="number"
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    min="1"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🚪 Унтлагын өрөө
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="1"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🛁 Угаалгын өрөө
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="1"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Size & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📐 Хэмжээ (м²)
                  </label>
                  <input
                    type="number"
                    name="size_sqm"
                    value={formData.size_sqm}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔢 Боломжтой өрөөний тоо
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 Нэг шөнийн үнэ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price_per_night"
                    value={formData.price_per_night}
                    onChange={handleChange}
                    placeholder="150000"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏷️ Хямдралтай үнэ
                  </label>
                  <input
                    type="number"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    placeholder="120000"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Multiple Images Upload */}
          <Card className="mb-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ Өрөөний зургууд</h3>
            
            {/* Main Image Selection */}
            {previewImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">⭐ Гол зураг:</p>
                <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg">
                  <img
                    src={previewImages[mainImageIndex]}
                    alt="Main image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-1">
                    Гол зураг
                  </div>
                </div>
              </div>
            )}
            
            {/* Image Gallery */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">📷 Зургууд ({previewImages.length})</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className={`w-24 h-24 object-cover rounded-lg border-2 transition ${
                        mainImageIndex === index ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {mainImageIndex !== index && (
                      <button
                        type="button"
                        onClick={() => setAsMainImage(index)}
                        className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center opacity-0 group-hover:opacity-100 transition"
                      >
                        Гол болгох
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Upload Button */}
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-1">Нэмэх</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400">Олон зураг нэмэх боломжтой. Гол зургаа сонгох боломжтой.</p>
            </div>
            
            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600">Зураг хуулагдаж байна...</span>
                  <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Description & Amenities */}
          <Card className="mb-6 border-0 shadow-lg">
            <div className="space-y-5">
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Тайлбар
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Өрөөний дэлгэрэнгүй мэдээлэл, онцлог үйлчилгээнүүд..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✨ Үйлчилгээнүүд
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={amenitiesInput}
                    onChange={(e) => setAmenitiesInput(e.target.value)}
                    placeholder="Жишээ: WiFi, TV, Air conditioning"
                    className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  />
                  <Button type="button" variant="secondary" onClick={addAmenity}>
                    + Нэмэх
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                      ✨ {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Өрөө боломжтой</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              ← Буцах
            </Button>
            <Button type="submit" isLoading={loading} variant="primary">
              {loading ? 'Хадгалж байна...' : '✓ Өрөө нэмэх'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}