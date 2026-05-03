export default function Home() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-rose-50 -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Đánh Thức Vẻ Đẹp <span className="text-pink-600">Tiềm Ẩn</span> Của Bạn
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto mb-10">
          Lan Anh Beauty SPA mang đến cho bạn trải nghiệm thư giãn tuyệt đối cùng các dịch vụ chăm sóc sắc đẹp chuẩn y khoa hàng đầu.
        </p>
        <div className="flex justify-center gap-4">
          <button className="px-8 py-4 bg-pink-600 text-white rounded-full font-semibold text-lg hover:bg-pink-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            Khám phá dịch vụ
          </button>
        </div>
      </div>
    </div>
  );
}
