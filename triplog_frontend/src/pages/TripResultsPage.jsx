/* src/pages/TripResultsPage.jsx */

import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import MapDisplay from "../components/MapDisplay";
import DailyLogTable from "../components/DailyLogTable";
import "../styles/main.css";

/* This is the main results page that displays the complete trip plan. */
const TripResultsPage = () => {
  /* useLocation hook gets the data passed from the previous page (the form). */
  const location = useLocation();
  const navigate = useNavigate();
  const apiResponse = location.state?.tripData;

  /* This is a safety check to handle cases where a user navigates here directly. */
  if (
    !apiResponse || 
    !apiResponse.trip || 
    !Array.isArray(apiResponse.hos_logs) ||
    !Array.isArray(apiResponse.trip.stops)
  ) {
    return (
      <div className="page-container" style={{ textAlign: "center" }}>
        <h1>Error</h1>
        <p>No trip data available or the data is malformed.</p>
        <button className="results-button" onClick={() => navigate("/")}>Back to Form</button>
      </div>
    );
  }

  /* Destructure the data from the API response for easier use. */
  const { trip, hos_logs } = apiResponse;

  /* The component renders the main layout, using specialized child components for each section. */
  return (
    <div className="page-container">
      <h1>Your Trip Plan & HOS Logs</h1>

      <h2>Route Map</h2>
      {/* The MapDisplay component is responsible for rendering the Leaflet map. */}
      <MapDisplay routePoints={trip.route_points} stops={trip.stops} />

      <h2>Daily HOS Logs</h2>
      {/* The DailyLogTable component is responsible for rendering all the daily log cards. */}
      <DailyLogTable hosLogs={hos_logs} />
      
      <Link to="/" className="results-button">
        Plan Another Trip
      </Link>
    </div>
  );
};

export default TripResultsPage;