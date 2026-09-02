import { Routes, Route } from 'react-router-dom';
import { VehiclesProvider } from './context/VehiclesContext';
import SitePage from './pages/SitePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <VehiclesProvider>
      <Routes>
        <Route path="/" element={<SitePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<SitePage />} />
      </Routes>
    </VehiclesProvider>
  );
}
