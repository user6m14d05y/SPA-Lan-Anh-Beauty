import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import Contacts from "./pages/Contacts";
import Chat from "./pages/Chat";
import Staffs from "./pages/Staffs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="customers" element={<Customers />} />
          <Route path="services" element={<Services />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="chat" element={<Chat />} />
          <Route path="staffs" element={<Staffs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
