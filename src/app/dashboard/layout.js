// ❌ Эдгээр импортыг устгах
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import "../globals.css";
// import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Dashboard | Travel Booking App",
  description: "Хэрэглэгчийн dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    // ✅ Header, Footer, Toaster-гүй - зөвхөн children
    <div className="dashboard-container">
      {children}
    </div>
  );
}