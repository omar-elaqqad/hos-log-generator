/* src/api/tripApi.js */

import axios from "axios";

/* The base URL of the Django backend.*/
const BASE_URL = "http://127.0.0.1:8000/api";

/* This function handles the communication between the React frontend and the Django backend. */
export const createTrip = async (tripData) => {
  try {
    /* Get today's date and format it as YYYY-MM-DD, which the backend expects. */
    const today = new Date().toISOString().split('T')[0];

    /* Construct the payload object. This must match the fields the backend API expects. */
    const payload = {
      current_location: tripData.currentLocation,
      pickup_location: tripData.pickupLocation,
      dropoff_location: tripData.dropoffLocation,
      start_date: today, /* The start date is set to today. */
      current_cycle_used_hours: tripData.cycleUsedHours,
    };

    /* Use axios to send a POST request to the backend's '/trips/' endpoint with the payload. */
    const response = await axios.post(`${BASE_URL}/trips/`, payload);
    
    /* Return the data from the backend's response, which contains the full trip plan. */
    return response.data;
  } catch (error) {
    /* If the API call fails, log the error to the console and re-throw it. */
    console.error("API error:", error.response || error.message);
    throw error;
  }
};