'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { resortAPI, categoryAPI, locationAPI, resortTypeAPI, uploadAPI } from '../../../lib/api';
import { requireAuth, getUser } from '../../../lib/auth';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { toast } from 'react-hot-toast';



export default function NewResortPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Resort form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    location_id: '',
    category_id: '',
    resort_type_id: '',
    image_url: '',
    cover_image: '',
    images: [],
  });
  
  // Units data
  const [units, setUnits] = useState([]);
  const [currentUnit, setCurrentUnit] = useState({
    name: '',
    type: 'standard',
    capacity: 2,
    beds: 1,
    price_per_night: '',
    description: '',
    amenities: [],
    is_available: true,
  });
  
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  
  const [previewImage, setPreviewImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [resortTypes, setResortTypes] = useState([]);
  const [locations, setLocations] = useState([]);

  // Өрөөний төрлүүд
  const unitTypes = [
    { value: 'standard', label: '🏨 Стандарт' },
    { value: 'deluxe', label: '✨ Делюкс' },
    { value: 'suite', label: '👑 Сьют' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Гэр бүлийн' },
    { value: 'villa', label: '🏡 Вилла' },
  ];

  useEffect(() => {
    if (!requireAuth(router, 'resort_owner')) return;
    fetchSelectData();
  }, [router]);

  const fetchSelectData = async () => {
    try {
      const [categoriesRes, typesRes, locationsRes] = await Promise.all([
        categoryAPI.getAll().catch(() => ({ data: [] })),
        resortTypeAPI.getAll().catch(() => ({ data: [] })),
        locationAPI.getAll().catch(() => ({ data: [] })),
      ]);
      
      setCategories(categoriesRes.data || []);
      setResortTypes(typesRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error fetching select data:', error);
      setCategories([
        { id: 1, name: '🏨 Зочид буудал', name_mn: 'Зочид буудал' },
        { id: 2, name: '🏖️ Амралтын газар', name_mn: 'Амралтын газар' },
        { id: 3, name: '🏕️ Resort', name_mn: 'Resort' },
      ]);
      setResortTypes([
        { id: 1, name: 'Luxury', name_mn: '⭐ Тансаг' },
        { id: 2, name: 'Economy', name_mn: '💰 Эдийн засгийн' },
        { id: 3, name: 'Family', name_mn: '👨‍👩‍👧‍👦 Гэр бүлийн' },
      ]);
      setLocations([
        { id: 1, province: 'Төв', city: 'Улаанбаатар' },
        { id: 2, province: 'Төв', city: 'Эрдэнэ' },
        { id: 3, province: 'Дархан-Уул', city: 'Дархан' },
      ]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUnitChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentUnit(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addAmenity = () => {
    if (amenitiesInput.trim()) {
      setCurrentUnit(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenitiesInput.trim()]
      }));
      setAmenitiesInput('');
    }
  };

  const removeAmenity = (index) => {
    setCurrentUnit(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const addUnit = () => {
    if (!currentUnit.name || !currentUnit.price_per_night) {
      toast.error('Өрөөний нэр болон үнийг оруулна уу');
      return;
    }
    
    if (editingUnitIndex !== null) {
      const updatedUnits = [...units];
      updatedUnits[editingUnitIndex] = { ...currentUnit, id: Date.now() };
      setUnits(updatedUnits);
      setEditingUnitIndex(null);
      toast.success('Өрөө амжилттай шинэчлэгдлээ');
    } else {
      setUnits(prev => [...prev, { ...currentUnit, id: Date.now() }]);
      toast.success('Өрөө амжилттай нэмэгдлээ');
    }
    
    setCurrentUnit({
      name: '',
      type: 'standard',
      capacity: 2,
      beds: 1,
      price_per_night: '',
      description: '',
      amenities: [],
      is_available: true,
    });
    setShowUnitForm(false);
  };

  const editUnit = (index) => {
    setCurrentUnit(units[index]);
    setEditingUnitIndex(index);
    setShowUnitForm(true);
  };

  const removeUnit = (index) => {
    if (confirm('Та энэ өрөөг устгахдаа итгэлтэй байна уу?')) {
      setUnits(prev => prev.filter((_, i) => i !== index));
      toast.success('Өрөө устгагдлаа');
    }
  };

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Зургийн хэмжээ 5MB-с бага байх ёстой');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Зөвхөн зураг файл оруулна уу');
      return;
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
      const result = await uploadAPI.uploadImage(file, 'resort');
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        if (imageType === 'cover') {
          setPreviewImage(result.data.url);
          setFormData(prev => ({ ...prev, cover_image: result.data.url, image_url: prev.image_url || result.data.url }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            images: [...prev.images, result.data.url],
            image_url: prev.image_url || result.data.url 
          }));
        }
        toast.success('Зураг амжилттай хуулагдлаа');
        setUploadProgress(0);
      }, 500);
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
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
    if (formData.image_url === formData.images[index] && newImages.length > 0) {
      setFormData(prev => ({ ...prev, image_url: newImages[0] }));
    } else if (newImages.length === 0) {
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
    toast.success('Зураг хасагдлаа');
  };

  const removeCoverImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, cover_image: '' }));
    toast.success('Cover зураг хасагдлаа');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.address) {
      toast.error('Заавал бөглөх талбаруудыг бөглөнө үү');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = getUser();
      
      // 1. Create resort
      const resortData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        location_id: formData.location_id || null,
        category_id: formData.category_id || null,
        resort_type_id: formData.resort_type_id || null,
        image_url: formData.image_url || null,
        cover_image: formData.cover_image || null,
        images: formData.images.length > 0 ? formData.images : null,
        owner_id: user?.id,
        is_approved: false,
      };
      
      const resortResult = await resortAPI.create(resortData);
      const newResortId = resortResult.data.id;
      
      // 2. Create all units for this resort
      if (units.length > 0) {
        for (const unit of units) {
          const unitData = {
            resort_id: newResortId,
            name: unit.name,
            type: unit.type,
            capacity: unit.capacity,
            beds: unit.beds,
            price_per_night: parseFloat(unit.price_per_night),
            description: unit.description,
            amenities: unit.amenities,
            is_available: unit.is_available,
          };
          await unitAPI.create(unitData);
        }
      }
      
      toast.success(`🎉 Амралтын газар болон ${units.length} өрөө амжилттай нэмэгдлээ!`);
      router.push('/resort_owner/resorts');
    } catch (error) {
      console.error('Create resort error:', error);
      toast.error(error.message || 'Амралтын газар нэмэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '📝 Үндсэн мэдээлэл', icon: '📝' },
    { id: 'units', label: '🏠 Өрөөнүүд', icon: '🏠' },
    { id: 'images', label: '🖼️ Зураг', icon: '🖼️' },
    { id: 'preview', label: '👁️ Preview', icon: '👁️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Шинэ амралтын газар нэмэх
          </h1>
          <p className="text-gray-500 mt-2">Амралтын газар болон өрөөнүүдийн мэдээллийг оруулна уу</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <Card className="mb-6 border-0 shadow-xl">
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏷️ Амралтын газрын нэр <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Жишээ: Terelj Luxury Resort"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Тайлбар <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Амралтын газрын дэлгэрэнгүй мэдээлэл..."
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Хаяг <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Бүрэн хаяг"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🌍 Байршил</label>
                    <select
                      name="location_id"
                      value={formData.location_id}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Сонгох</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.city}, {loc.province}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Ангилал</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Сонгох</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name_mn || cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Төрөл</label>
                    <select
                      name="resort_type_id"
                      value={formData.resort_type_id}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Сонгох</option>
                      {resortTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name_mn}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" variant="primary" onClick={() => setActiveTab('units')}>
                    Дараах → Өрөөнүүд
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Units Tab */}
          {activeTab === 'units' && (
            <Card className="mb-6 border-0 shadow-xl">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">🏠 Өрөөнүүд</h3>
                  {!showUnitForm && (
                    <Button type="button" variant="primary" size="sm" onClick={() => setShowUnitForm(true)}>
                      + Шинэ өрөө нэмэх
                    </Button>
                  )}
                </div>

                {/* Unit List */}
                {units.length > 0 && (
                  <div className="space-y-3">
                    {units.map((unit, index) => (
                      <div key={unit.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{unit.name}</span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{unit.type}</span>
                            <span className="text-xs text-gray-500">{unit.capacity} хүн</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">₮ {parseFloat(unit.price_per_night).toLocaleString()} / шөнө</p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => editUnit(index)}>Засах</Button>
                          <Button type="button" variant="danger" size="sm" onClick={() => removeUnit(index)}>Устгах</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Unit Form */}
                {showUnitForm && (
                  <div className="border-t pt-6 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-4">{editingUnitIndex !== null ? 'Өрөө засах' : 'Шинэ өрөө нэмэх'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Өрөөний нэр <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={currentUnit.name} onChange={handleUnitChange} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Төрөл</label>
                        <select name="type" value={currentUnit.type} onChange={handleUnitChange} className="w-full p-2 border rounded-lg">
                          {unitTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Хүний тоо</label>
                        <input type="number" name="capacity" value={currentUnit.capacity} onChange={handleUnitChange} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Орны тоо</label>
                        <input type="number" name="beds" value={currentUnit.beds} onChange={handleUnitChange} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Үнэ / шөнө <span className="text-red-500">*</span></label>
                        <input type="number" name="price_per_night" value={currentUnit.price_per_night} onChange={handleUnitChange} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">Тайлбар</label>
                        <textarea name="description" value={currentUnit.description} onChange={handleUnitChange} rows="2" className="w-full p-2 border rounded-lg" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">Үйлчилгээнүүд</label>
                        <div className="flex gap-2">
                          <input type="text" value={amenitiesInput} onChange={(e) => setAmenitiesInput(e.target.value)} placeholder="Жишээ: WiFi" className="flex-1 p-2 border rounded-lg" />
                          <Button type="button" variant="secondary" size="sm" onClick={addAmenity}>Нэмэх</Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {currentUnit.amenities.map((item, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{item} <button type="button" onClick={() => removeAmenity(idx)} className="ml-1 text-red-500">×</button></span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                      <Button type="button" variant="secondary" onClick={() => { setShowUnitForm(false); setEditingUnitIndex(null); setCurrentUnit({ name: '', type: 'standard', capacity: 2, beds: 1, price_per_night: '', description: '', amenities: [], is_available: true }); }}>Цуцлах</Button>
                      <Button type="button" variant="primary" onClick={addUnit}>{editingUnitIndex !== null ? 'Шинэчлэх' : 'Нэмэх'}</Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="secondary" onClick={() => setActiveTab('basic')}>← Буцах</Button>
                  <Button type="button" variant="primary" onClick={() => setActiveTab('images')}>Дараах → Зураг</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <Card className="mb-6 border-0 shadow-xl">
              <div className="space-y-8">
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🎨 Cover зураг</h3>
                  <div className="flex items-start gap-6">
                    {previewImage ? (
                      <div className="relative group">
                        <img src={previewImage} alt="Cover preview" className="w-40 h-40 object-cover rounded-2xl shadow-lg border-4 border-white" />
                        <button type="button" onClick={removeCoverImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition shadow-lg">×</button>
                      </div>
                    ) : (
                      <label className="w-40 h-40 border-3 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <svg className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs text-gray-500 mt-2">Cover зураг</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" disabled={uploading} />
                      </label>
                    )}
                    <div className="flex-1"><p className="text-sm text-gray-600">Гол зураг (Cover)</p><p className="text-xs text-gray-400">JPG, PNG - 5MB хүртэл</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ Галерей зураг</h3>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt="Gallery" className="w-28 h-28 object-cover rounded-xl shadow-md border-2 border-white" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition">×</button>
                      </div>
                    ))}
                    <label className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-xs text-gray-500 mt-1">Нэмэх</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>

                {uploading && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm text-blue-600">Зураг хуулагдаж байна...</span><span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span></div>
                    <div className="w-full bg-blue-200 rounded-full h-2"><div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="secondary" onClick={() => setActiveTab('units')}>← Буцах</Button>
                  <Button type="button" variant="primary" onClick={() => setActiveTab('preview')}>Дараах → Preview</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <Card className="mb-6 border-0 shadow-xl">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">👁️ Мэдээллийн хураангуй</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-500">Амралтын газрын нэр</p><p className="font-semibold">{formData.name || '—'}</p></div>
                    <div><p className="text-sm text-gray-500">Хаяг</p><p className="font-semibold">{formData.address || '—'}</p></div>
                    <div className="md:col-span-2"><p className="text-sm text-gray-500">Тайлбар</p><p className="text-gray-700">{formData.description || '—'}</p></div>
                    <div className="md:col-span-2"><p className="text-sm text-gray-500">Өрөөнүүд</p><p className="text-gray-700">{units.length} өрөө</p></div>
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="secondary" onClick={() => setActiveTab('images')}>← Буцах</Button>
                  <Button type="submit" isLoading={loading} variant="primary" className="px-8">{loading ? 'Хадгалж байна...' : '✓ Амралтын газар нэмэх'}</Button>
                </div>
              </div>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}