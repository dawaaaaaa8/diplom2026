"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaHotel, FaCalendarAlt, FaUsers, FaDollarSign, FaStar, FaChartLine } from "react-icons/fa";
import StatCard from "./StatCard";
import RecentBookingsTable from "./RecentBookingsTable";
import RevenueChart from "./RevenueChart";

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalResorts: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingResorts: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const statsResponse = await fetch(`http://localhost:5000/api/admin/stats?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      const bookingsResponse = await fetch("http://localhost:5000/api/admin/recent-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.data || []);
      }
    } catch (error) {
      toast.error("Өгөгдөл татахад алдаа гарлаа");
      console.error("Dashboard алдаа:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { title: "Амралтын газрууд", value: stats.totalResorts, icon: <FaHotel className="text-2xl" />, color: "blue", link: "/admin/resorts" },
    { title: "Захиалгууд", value: stats.totalBookings, icon: <FaCalendarAlt className="text-2xl" />, color: "green", link: "/admin/bookings" },
    { title: "Хэрэглэгчид", value: stats.totalUsers, icon: <FaUsers className="text-2xl" />, color: "purple", link: "/admin/users" },
    { title: "Орлого", value: `₮${stats.totalRevenue.toLocaleString()}`, icon: <FaDollarSign className="text-2xl" />, color: "yellow", link: "/admin/finance" },
    { title: "Дундаж үнэлгээ", value: stats.averageRating.toFixed(1), icon: <FaStar className="text-2xl" />, color: "pink" },
    { title: "Хүлээгдэж байгаа", value: stats.pendingResorts, icon: <FaChartLine className="text-2xl" />, color: "orange", link: "/admin/resorts?status=pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8">
        <h1 className="text-3xl font-bold">
          Админ панелд тавтай морил{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-blue-100 mt-2">Эндээс та системийн бүх мэдээллийг удирдаж болно</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsData.map((stat, index) => (
          <StatCard key={index} stat={stat} loading={loading} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Орлогын график</h2>
        <RevenueChart timeRange={timeRange} />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Сүүлийн захиалгууд</h2>
        <RecentBookingsTable bookings={recentBookings} loading={loading} />
      </div>
    </div>
  );
}