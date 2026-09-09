import { Routes, Route } from 'react-router-dom';
import { VehiclesProvider } from './context/VehiclesContext';
import SitePage from './pages/SitePage';
import AdminPage from './pages/AdminPage';
import DriverPage from './pages/DriverPage';

export default function App() {
  return (
    <VehiclesProvider>
      <Routes>
        <Route path="/" element={<SitePage />} />
        <Route path="/admin/login" element={<AdminPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/driver/login" element={<DriverPage />} />
        <Route path="*" element={<SitePage />} />
      </Routes>
    </VehiclesProvider>
  );
}
