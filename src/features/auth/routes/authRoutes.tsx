import { Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RoleSelectPage from "../pages/RoleSelectPage";

export const authRoutes = [
  <Route key="register" path="/" element={<RegisterPage />} />,
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="register" path="/role-select" element={<RoleSelectPage />} />,
  
];