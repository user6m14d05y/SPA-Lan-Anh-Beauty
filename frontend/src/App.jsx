import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Components
import ProtectedRoute from "./components/admin/ProtectedRoute";

// Client Pages
import Home from "./pages/client/Home";
import Booking from "./pages/client/Booking";
import About from "./pages/client/About";
import ClientServices from "./pages/client/Services";
import ServiceDetail from "./pages/client/ServiceDetail";
import Contact from "./pages/client/Contact";
import Blog from "./pages/client/Blog";

// Admin Pages
import Login from "./pages/admin/Login";
import Unauthorized from "./pages/admin/Unauthorized";
import Dashboard from "./pages/admin/Dashboard";
import Bookings from "./pages/admin/Bookings";
import ClosedPeriods from "./pages/admin/ClosedPeriods";
import Customers from "./pages/admin/Customers";
import AdminServices from "./pages/admin/Services";
import AddService from "./pages/admin/Services/add";
import EditService from "./pages/admin/Services/edit";
import CategoryServices from "./pages/admin/CategoryServices";
import Contacts from "./pages/admin/Contacts";
import Chat from "./pages/admin/Chat";
import Staffs from "./pages/admin/Staffs";
import UsersPage from "./pages/admin/Users";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Client Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<ClientServices />} />
            <Route path="services/Detail/:slug" element={<ServiceDetail />} />
            <Route path="booking" element={<Booking />} />
            <Route path="contact" element={<Contact />} />
            <Route path="blog" element={<Blog />} />
          </Route>

          {/* Admin Public Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/unauthorized" element={<Unauthorized />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="closed-periods" element={<ClosedPeriods />} />
            <Route path="customers" element={<Customers />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="services/add" element={<AddService />} />
            <Route path="services/edit/:id" element={<EditService />} />
            <Route path="category-services" element={<CategoryServices />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="chat" element={<Chat />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="staffs" element={<Staffs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
