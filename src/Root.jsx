import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LandingPage from './components/pages/LandingPage';

export default function Root() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<App />} />
      </Routes>
    </HashRouter>
  );
}
