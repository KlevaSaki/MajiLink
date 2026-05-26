import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { authRoutes } from "../src/features/auth/routes/authRoutes";

import CustomerHome from './features/customer/pages/CustomerHome';
import VendorDashboard from './features/vendor/pages/VendorDashboard';
import DriverDashboard from './features/driver/pages/DriverDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {authRoutes}

        //Dashboards
        <Route key="customer" path="/customer-home" element={<CustomerHome />} />,
        <Route key="vendor" path="/vendor" element={<VendorDashboard />} />,
        <Route key="driver" path="/driver" element={<DriverDashboard />} />,
      </Routes>
    </BrowserRouter>
    
  )
}

export default App
