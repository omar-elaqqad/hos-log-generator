/* src/pages/TripFormPage.jsx */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../api/tripApi";
import "../styles/main.css";

/* This component renders the initial form where the user inputs their trip details. */
const TripFormPage = () => {
  /* useNavigate is a hook from React Router to programmatically navigate to other pages. */
  const navigate = useNavigate();

  /* useState hook manages the component's state, such as form inputs and loading status. */
  const [formData, setFormData] = useState({
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    cycleUsedHours: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* This function updates the state whenever a user types in an input field. */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* This function is called when the user submits the form. */
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError("");

    try {
      /* It calls our API function, sending the form data to the backend. */
      const response = await createTrip(formData);
      /* If successful, it navigates to the results page, passing the API response data. */
      navigate("/results", { state: { tripData: response } });
    } catch (err) {
      console.error(err);
      setError("Failed to generate logs. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* The JSX returned here defines the HTML structure of the form. */
  return (
    <div className="form-container">
      <h1>HOS Log Generator</h1>
      <p style={{textAlign: 'center', marginTop: '-20px', marginBottom: '30px', color: '#555'}}>
        Plan your trip and get automated daily logs.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="currentLocation"
          placeholder="Current Location (e.g., New York, NY)"
          value={formData.currentLocation}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="pickupLocation"
          placeholder="Pickup Location (e.g., Chicago, IL)"
          value={formData.pickupLocation}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="dropoffLocation"
          placeholder="Dropoff Location (e.g., Denver, CO)"
          value={formData.dropoffLocation}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="cycleUsedHours"
          placeholder="Current Cycle Used (70hr/8day)"
          value={formData.cycleUsedHours}
          onChange={handleChange}
          required
          min="0"
          max="70"
        />
        
        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Logs"}
        </button>
      </form>
    </div>
  );
};

export default TripFormPage;