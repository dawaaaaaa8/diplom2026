// src/components/RecentBookingsTable.jsx
import React from 'react';

const RecentBookingsTable = ({ bookings }) => {
  // Жишээ өгөгдөл
  const sampleBookings = [
    { id: 1, customer: 'Бат', room: '101', checkIn: '2024-01-15', status: 'Идэвхтэй' },
    { id: 2, customer: 'Сараа', room: '102', checkIn: '2024-01-14', status: 'Дууссан' },
    { id: 3, customer: 'Наран', room: '201', checkIn: '2024-01-13', status: 'Идэвхтэй' },
  ];

  const bookingsData = bookings || sampleBookings;

  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Сүүлийн захиалгууд</h3>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-4 border-b">#</th>
            <th className="py-2 px-4 border-b">Үйлчлүүлэгч</th>
            <th className="py-2 px-4 border-b">Өрөө</th>
            <th className="py-2 px-4 border-b">Орох өдөр</th>
            <th className="py-2 px-4 border-b">Төлөв</th>
          </tr>
        </thead>
        <tbody>
          {bookingsData.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{booking.id}</td>
              <td className="py-2 px-4 border-b">{booking.customer}</td>
              <td className="py-2 px-4 border-b">{booking.room}</td>
              <td className="py-2 px-4 border-b">{booking.checkIn}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded text-xs ${
                  booking.status === 'Идэвхтэй' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentBookingsTable;