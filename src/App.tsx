import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/use-auth';
import { ProtectedRoute } from './components/protected-route';
import { BottomNav } from './components/bottom-nav';
import { Toaster } from './components/ui/sonner';
import { SignIn } from './pages/sign-in';
import { AuthCallback } from './pages/auth-callback';
import { Home } from './pages/home';
import { Contacts } from './pages/contacts';
import { Settings } from './pages/settings';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <Toaster />
    </AuthProvider>
  );
}
