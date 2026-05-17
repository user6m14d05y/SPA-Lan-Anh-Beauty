import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import ClosedPeriods from "./pages/ClosedPeriods";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import AddService from "./pages/Services/add";
import EditService from "./pages/Services/edit";
import CategoryServices from "./pages/CategoryServices";
import Contacts from "./pages/Contacts";
import Chat from "./pages/Chat";
import Staffs from "./pages/Staffs";
import UsersPage from "./pages/Users";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes — yêu cầu ADMIN hoặc STAFF */}
          <Route
            path="/"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="closed-periods" element={<ClosedPeriods />} />
            <Route path="customers" element={<Customers />} />
            <Route path="services" element={<Services />} />
            <Route path="services/add" element={<AddService />} />
            <Route path="services/edit/:id" element={<EditService />} />
            <Route path="category-services" element={<CategoryServices />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="chat" element={<Chat />} />
            <Route path="users" element={<UsersPage />} />
            {/* Staffs chỉ ADMIN mới thấy menu, nhưng route vẫn cần bảo vệ riêng */}
            <Route path="staffs" element={<Staffs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
