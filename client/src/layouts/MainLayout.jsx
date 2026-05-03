import { Outlet, Link } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="text-2xl font-bold text-pink-600">Lan Anh Beauty</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Trang chủ</Link>
            <Link to="/services" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Dịch vụ</Link>
            <Link to="/booking" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Đặt lịch</Link>
          </nav>
          <div className="flex items-center">
            <Link to="/booking" className="bg-pink-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-pink-700 transition-colors shadow-sm">
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2026 Lan Anh Beauty SPA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
