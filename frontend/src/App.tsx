import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChangelogPage from './pages/ChangelogPage';
import SongsPage from './pages/SongsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import EventsPage from './pages/EventsPage';
import SongsGridView from './pages/SongsGridView';
import ManagementPage from './pages/ManagementPage';
import UsersPage from './pages/UsersPage';

// Components
import { Layout, ProtectedRoute } from './components';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/changelog" element={
              <ProtectedRoute>
                <Layout>
                  <ChangelogPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/albums" element={
              <ProtectedRoute>
                <Layout>
                  <SongsGridView />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/songs" element={
              <ProtectedRoute>
                <Layout>
                  <SongsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/playlists" element={
              <ProtectedRoute>
                <Layout>
                  <PlaylistsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/events" element={
              <ProtectedRoute>
                <Layout>
                  <EventsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/management" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <ManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <AdminPage />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Notificaciones */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
