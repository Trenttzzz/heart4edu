import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { MonitoringPage } from './pages/MonitoringPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
      </Routes>
    </div>
  );
};

export default App;
