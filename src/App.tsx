import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import AllProductReport from './pages/reports/AllProductReport';
import SkuUpcReport from './pages/reports/SkuUpcReport';
import SkuTagReport from './pages/reports/SkuTagReport';
import TagSummaryReport from './pages/reports/TagSummaryReport';
import DetailedScanReport from './pages/reports/DetailedScanReport';
import NofReport from './pages/reports/NofReport';
import InterimSkuAreaReport from './pages/reports/InterimSkuAreaReport';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="reports/all-product" element={<AllProductReport />} />
            <Route path="reports/sku-upc" element={<SkuUpcReport />} />
            <Route path="reports/sku-tag" element={<SkuTagReport />} />
            <Route path="reports/tag-summary" element={<TagSummaryReport />} />
            <Route path="reports/detailed-scan" element={<DetailedScanReport />} />
            <Route path="reports/nof" element={<NofReport />} />
            <Route path="reports/interim-sku-area" element={<InterimSkuAreaReport />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;