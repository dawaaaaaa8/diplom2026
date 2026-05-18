"use client";

import Link from "next/link";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function StatCard({ stat, loading }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    pink: "bg-pink-100 text-pink-600",
    orange: "bg-orange-100 text-orange-600",
  };

  const CardContent = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
          {stat.icon}
        </div>
        <div className={`flex items-center text-sm font-medium ${
          stat.trend === "up" ? "text-green-600" : "text-red-600"
        }`}>
          {stat.trend === "up" ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
          {stat.change}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
      <p className="text-gray-600 text-sm">{stat.title}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-16 h-5 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return stat.link ? (
    <Link href={stat.link}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
}