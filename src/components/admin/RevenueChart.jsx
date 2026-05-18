"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueChart({ timeRange = "week" }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/revenue?range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setChartData({
          labels: data.data.labels,
          datasets: [
            {
              label: "Орлого (₮)",
              data: data.data.values,
              borderColor: "#3b82f6", // blue
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              tension: 0.3,
            },
          ],
        });
      } else {
        setChartData({
          labels: [],
          datasets: [],
        });
      }
    } catch (err) {
      console.error("RevenueChart алдаа:", err);
      setChartData({
        labels: [],
        datasets: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-64">
      {loading ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          График ачааллаж байна...
        </div>
      ) : (
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: true,
                text: "Орлогын график",
              },
            },
          }}
        />
      )}
    </div>
  );
}