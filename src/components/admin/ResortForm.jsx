"use client";

import { useState } from "react";
import {
  FaUpload,
  FaTrash,
  FaPlus,
  FaBed,
  FaWifi,
  FaSwimmingPool,
  FaParking,
  FaUtensils,
  FaTv,
  FaWind,
} from "react-icons/fa";

const amenitiesOptions = [
  { id: "wifi", label: "WiFi", icon: <FaWifi /> },
  { id: "pool", label: "Усан сан", icon: <FaSwimmingPool /> },
  { id: "parking", label: "Зогсоол", icon: <FaParking /> },
  { id: "restaurant", label: "Ресторан", icon: <FaUtensils /> },
  { id: "tv", label: "ТВ", icon: <FaTv /> },
  { id: "ac", label: "Агааржуулалт", icon: <FaWind /> },
  { id: "breakfast", label: "Өглөөний цай", icon: <FaUtensils /> },
];

export default function ResortForm({ initialData, onSubmit, loading, submitText = "Хадгалах" }) {
  const [formData, setFormData] = useState(initialData);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      if (name === "amenities") {
        const updatedAmenities = checked
          ? [...formData.amenities, value]
          : formData.amenities.filter((item) => item !== value);
        setFormData({ ...formData, amenities: updatedAmenities });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);

    // Preview үүсгэх
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Зурагнуудыг formData-д нэмэх
    const finalData = {
      ...formData,
      images: imagePreviews, // Сервер рүү явуулахад өөрчлөх шаардлагатай
    };
    
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Үндсэн мэдээлэл */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Үндсэн мэдээлэл</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Нэр *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Байршил *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Үнэ (₮) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Үнэлгээ (0-5)
            </label>
            <input
              type="number"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              min="0"
              max="5"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Өрөөний тоо *
            </label>
            <input
              type="number"
              name="rooms"
              value={formData.rooms}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Хүний тоо *
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тайлбар *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Цаг хугацаа */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Check-in/out цаг</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in цаг
            </label>
            <input
              type="time"
              name="checkInTime"
              value={formData.checkInTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out цаг
            </label>
            <input
              type="time"
              name="checkOutTime"
              value={formData.checkOutTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Тохилог байдал */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Тохилог байдал</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {amenitiesOptions.map((amenity) => (
            <label
              key={amenity.id}
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.amenities.includes(amenity.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-300"
              }`}
            >
              <input
                type="checkbox"
                name="amenities"
                value={amenity.id}
                checked={formData.amenities.includes(amenity.id)}
                onChange={handleInputChange}
                className="hidden"
              />
              <span className="text-blue-600">{amenity.icon}</span>
              <span>{amenity.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Зурагнууд */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Зурагнууд</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Зураг оруулах
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FaUpload className="mx-auto text-3xl text-gray-400 mb-2" />
            <p className="text-gray-600 mb-2">Зурагнуудыг энд чирж тавих эсвэл</p>
            <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
              Файл сонгох
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Preview зурагнууд */}
        {imagePreviews.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Сонгогдсон зурагнууд</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Цуцлах
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Хадгалагдаж байна...</span>
            </>
          ) : (
            <>
              <FaPlus />
              <span>{submitText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}