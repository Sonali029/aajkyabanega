import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import InviteAcceptPage from './pages/Auth/InviteAcceptPage';
import CreateFamilyPage from './pages/Onboarding/CreateFamilyPage';
import HomePage from './pages/Home/HomePage';
import MealSlotPage from './pages/MealSlot/MealSlotPage';
import DishBrowserPage from './pages/Dishes/DishBrowserPage';
import AddDishPage from './pages/Dishes/AddDishPage';
import FamilyPage from './pages/Family/FamilyPage';
import MealConfigPage from './pages/Settings/MealConfigPage';
import AppLayout from './components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const FamilyRequiredRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, family, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!family) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, family } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/invite/accept" element={<InviteAcceptPage />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            {family ? <Navigate to="/" replace /> : <CreateFamilyPage />}
          </ProtectedRoute>
        }
      />

      {/* App (requires family) */}
      <Route
        path="/"
        element={
          <FamilyRequiredRoute>
            <AppLayout />
          </FamilyRequiredRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="mealslot/:date/:slot" element={<MealSlotPage />} />
        <Route path="dishes" element={<DishBrowserPage />} />
        <Route path="dishes/add" element={<AddDishPage />} />
        <Route path="family" element={<FamilyPage />} />
        <Route path="settings" element={<MealConfigPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
