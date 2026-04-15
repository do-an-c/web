import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import POIManagement from './pages/POIManagement';
import NarrationHistory from './pages/NarrationHistory';
import TTSGenerator from './pages/TTSGenerator';
import ApprovalManagement from './pages/ApprovalManagement';
import Analytics from './pages/Analytics';
import MenuManagement from './pages/MenuManagement';
import ReviewManagement from './pages/ReviewManagement';
import SystemSettings from './pages/SystemSettings';
import TourManagement from './pages/TourManagement';
import UserManagement from './pages/UserManagement';
import AppDownload from './pages/AppDownload';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/poi"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <POIManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/menu"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MenuManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reviews"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ReviewManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tts"
                element={
                  <ProtectedRoute requireAdmin>
                    <MainLayout>
                      <TTSGenerator />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/narration"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NarrationHistory />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/approval"
                element={
                  <ProtectedRoute requireAdmin>
                    <MainLayout>
                      <ApprovalManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <MainLayout>
                      <Analytics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
              path="/tours"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TourManagement />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin>
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <MainLayout>
                    <SystemSettings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/app-download"
              element={
                <ProtectedRoute requireAdmin>
                  <MainLayout>
                    <AppDownload />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
