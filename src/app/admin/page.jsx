// AdminPageWrapper.jsx - Debug хувилбар
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import AdminDashboard from "../../components/admin/AdminDashboard";

export default function AdminPageWrapper() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [debug, setDebug] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      console.log("=== DEBUG START ===");
      
      const token = localStorage.getItem("token");
      console.log("1. Token found:", !!token);
      
      if (!token) {
        setDebug("Токен олдсонгүй");
        toast.error("Нэвтрэх шаардлагатай");
        router.push("/login");
        return;
      }

      try {
        const userStr = localStorage.getItem("user");
        console.log("2. User string:", userStr);
        
        if (!userStr) {
          setDebug("Хэрэглэгчийн мэдээлэл олдсонгүй");
          toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
          router.push("/login");
          return;
        }

        const storedUser = JSON.parse(userStr);
        console.log("3. Parsed user:", storedUser);
        console.log("4. Role ID:", storedUser.role_id);
        
        const ADMIN_ROLE_ID = 2;
        
        if (Number(storedUser.role_id) === ADMIN_ROLE_ID){
          router.push("/admin");
          return;
        }
        else{
           toast.error("Админ эрх шаардлагатай ");
          router.push("/dashboard");
          return;

        }

        console.log("5. Auth successful!");
        setDebug("Амжилттай нэвтэрлээ");
        setUser(storedUser);
        setLoading(false);
        
      } catch (err) {
        console.error("6. Error:", err);
        setDebug(`Алдаа: ${err.message}`);
        toast.error("Алдаа гарлаа");
        router.push("/login");
      }
      
      console.log("=== DEBUG END ===");
    };

    // Бага зэрэг хүлээгээд шалгах (localStorage бичигдэх хугацаа олгох)
    setTimeout(checkAuth, 100);
  }, [router]);

  if (loading) {
    return (
      <div className="text-center mt-20">
        <div>Loading...</div>
        <div className="text-sm text-gray-500 mt-2">{debug}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
      </div>
    );
  }

  return <AdminDashboard user={user} />;
}