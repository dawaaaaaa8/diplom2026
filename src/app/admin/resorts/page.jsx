"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import Link from "next/link";

export default function ResortsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchResorts();
  }, [currentPage, status]);

  const fetchResorts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `http://localhost:5000/api/resorts/admin/all?page=${currentPage}&limit=10`;
      if (status !== "all") {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResorts(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error("Амралтын газруудыг авахад алдаа гарлаа");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Сервертэй холбогдоход алдаа");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, isApproved) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/resorts/admin/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_approved: isApproved }),
      });

      if (response.ok) {
        toast.success(isApproved ? "Амралтын газар баталгаажлаа" : "Баталгаажуулалт цуцлагдлаа");
        fetchResorts();
      }
    } catch (error) {
      toast.error("Үйлдэл хийхэд алдаа гарлаа");
    }
  };

  const handleFeature = async (id, isFeatured) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/resorts/admin/${id}/feature`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_featured: isFeatured }),
      });

      if (response.ok) {
        toast.success(isFeatured ? "Амралтын газар онцлогдлоо" : "Онцлог жагсаалтаас хаслаа");
        fetchResorts();
      }
    } catch (error) {
      toast.error("Үйлдэл хийхэд алдаа гарлаа");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Та энэ амралтын газрыг устгахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/resorts/admin/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Амралтын газар устгагдлаа");
        fetchResorts();
      }
    } catch (error) {
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  const filteredResorts = resorts.filter(resort =>
    resort.name.toLowerCase().includes(search.toLowerCase()) ||
    resort.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Амралтын газрууд</h1>
          <p className="text-gray-600">Бүх амралтын газруудын жагсаалт</p>
        </div>
        <Link
          href="/admin/resorts/create"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FaPlus />
          <span>Шинэ амралтын газар</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Амралтын газраар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setStatus("all")}
              className={`px-4 py-2 rounded-lg ${
                status === "all"
                  ? "bg-blue-100 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => setStatus("approved")}
              className={`px-4 py-2 rounded-lg ${
                status === "approved"
                  ? "bg-green-100 text-green-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Баталгаажсан
            </button>
            <button
              onClick={() => setStatus("pending")}
              className={`px-4 py-2 rounded-lg ${
                status === "pending"
                  ? "bg-yellow-100 text-yellow-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Хүлээгдэж байгаа
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredResorts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Амралтын газар олдсонгүй
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Нэр
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Байршил
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Эзэн
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Төлөв
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Онцлог
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResorts.map((resort) => (
                  <tr key={resort.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {resort.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {resort.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {resort.address?.substring(0, 30)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{resort.province}</div>
                      <div className="text-sm text-gray-500">{resort.city}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{resort.owner_name}</div>
                      <div className="text-sm text-gray-500">{resort.owner_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        resort.is_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resort.is_approved ? 'Баталгаажсан' : 'Хүлээгдэж байна'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleFeature(resort.id, !resort.is_featured)}
                        className={`p-2 rounded-lg ${
                          resort.is_featured
                            ? 'text-yellow-500 hover:text-yellow-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={resort.is_featured ? 'Онцлог жагсаалтаас хасах' : 'Онцлох'}
                      >
                        <FaStar className="text-lg" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {!resort.is_approved && (
                          <button
                            onClick={() => handleApprove(resort.id, true)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Баталгаажуулах"
                          >
                            <FaCheck />
                          </button>
                        )}
                        {resort.is_approved && (
                          <button
                            onClick={() => handleApprove(resort.id, false)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Баталгаажуулалтыг цуцлах"
                          >
                            <FaTimes />
                          </button>
                        )}
                        <Link
                          href={`/admin/resorts/${resort.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Засах"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(resort.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Устгах"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Өмнөх
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Дараах
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



