import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { SupabaseProvider } from "./supabase/SupabaseProvider";
import { AuthGuard } from "./supabase/AuthGuard";
import { AuthLayout } from "./ui/layouts/AuthLayout";
import { AppLayout } from "./ui/layouts/AppLayout";
import { LoginPage } from "./ui/pages/auth/LoginPage";
import { RegisterPage } from "./ui/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./ui/pages/auth/ForgotPasswordPage";
import { CompleteRegistrationPage } from "./ui/pages/auth/CompleteRegistrationPage";
import { DashboardPage } from "./ui/pages/dashboard/DashboardPage";
import { SettingsPage } from "./ui/pages/settings/SettingsPage";
import { CreditCardsPage } from "./ui/pages/credit-cards/CreditCardsPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SupabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/complete-registration" element={<CompleteRegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="cartoes" element={<CreditCardsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </SupabaseProvider>
  </React.StrictMode>,
);
