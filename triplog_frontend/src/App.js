import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import TripFormPage from "./pages/TripFormPage";
import TripResultsPage from "./pages/TripResultsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TripFormPage />} />
        <Route path="/results" element={<TripResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
