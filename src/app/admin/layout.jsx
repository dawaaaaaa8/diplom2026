"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        toast.error("Нэвтрэх шаардлагатай");
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      
      // Админ эрх шалгах
      if (parsedUser.role_name !== "admin") {
        toast.error("Та админ эрхгүй байна");
        router.push("/dashboard");
        return;
      }
      
      // Серверээс эрх шалгах (сонголттой)
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast.error("Нэвтрэх эрх дууссан");
          router.push("/login");
          return;
        }

        const userData = await response.json();
        setUser(userData.data);
      } catch (error) {
        console.error("Сервертэй холбогдоход алдаа:", error);
        setUser(parsedUser); // LocalStorage дээрх мэдээлэл ашиглах
      }

    } catch (error) {
      console.error("Админ эрх шалгахад алдаа:", error);
      toast.error("Системийн алдаа");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}