"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ResortForm from "../../../../components/admin/ResortForm";

export default function CreateResortPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/admin/resorts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Амралтын газар амжилттай бүртгэгдлээ!");
        router.push("/admin/resorts");
      } else {
        toast.error(data.message || "Алдаа гарлаа");
      }
    } catch (error) {
      toast.error("Сервертэй холбогдоход алдаа гарлаа");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const initialData = {
    name: "",
    description: "",
    location: "",
    price: "",
    rating: "",
    amenities: [],
    images: [],
    capacity: "",
    rooms: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Шинэ амралтын газар бүртгэх
        </h1>
        <p className="text-gray-600">
          Доорх маягтыг бөглөн амралтын газар бүртгэнэ үү
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <ResortForm 
          initialData={initialData}
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Бүртгэх"
        />
      </div>
    </div>
  );
}