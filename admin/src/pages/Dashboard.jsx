export default function Dashboard() {
  const stats = [
    { label: "Lịch hẹn hôm nay", value: "12", color: "bg-blue-500" },
    { label: "Doanh thu ngày", value: "5.2M", color: "bg-green-500" },
    { label: "Khách hàng mới", value: "4", color: "bg-purple-500" },
    { label: "Đánh giá 5 sao", value: "8", color: "bg-yellow-500" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${stat.color} flex-shrink-0 opacity-20`}></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch hẹn sắp tới</h3>
        <div className="text-center text-gray-500 py-10">
          Chưa có dữ liệu. Vui lòng kết nối API backend.
        </div>
      </div>
    </div>
  );
}
