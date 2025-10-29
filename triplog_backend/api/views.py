# api/views.py

import requests
from datetime import timedelta
from rest_framework import generics
from rest_framework.response import Response
from .models import Trip
from .serializers import TripSerializer
from .hos_utils import calculate_hos, AVERAGE_DRIVING_SPEED_MPH 

def get_coords(location_name):
    """
    Helper function to convert a location name (e.g., "Chicago, IL") into geographic coordinates.
    It uses the free Nominatim (OpenStreetMap) geocoding API.
    """
    if not location_name: return None
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={location_name}&format=json&limit=1"
        response = requests.get(url, headers={'User-Agent': 'HOSApp/1.0'})
        response.raise_for_status()
        data = response.json()
        if data: return [float(data[0]['lat']), float(data[0]['lon'])]
    except requests.RequestException as e:
        print(f"Error geocoding {location_name}: {e}")
    return None

def get_route_and_distance(*waypoint_coords):
    """
    Helper function to get the driving distance and route geometry between multiple points.
    It uses the free Project OSRM routing engine API.
    """
    valid_coords = [coords for coords in waypoint_coords if coords]
    if len(valid_coords) < 2: return {"route": [], "distance": 0}
    try:
        # Format coordinates into the string required by the OSRM API.
        coords_str = ";".join([f"{lon},{lat}" for lat, lon in valid_coords])
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if data and 'routes' in data and data['routes']:
            route = data['routes'][0]
            distance_miles = route['distance'] * 0.000621371 # Convert meters to miles.
            # Flip coordinates from (lon, lat) to (lat, lon) for Leaflet map compatibility.
            route_points = [[p[1], p[0]] for p in route['geometry']['coordinates']]
            return {"route": route_points, "distance": distance_miles}
    except requests.RequestException as e:
        print(f"Error getting route: {e}")
    return {"route": [], "distance": 0}


class TripListCreateView(generics.ListCreateAPIView):
    """
    This is the main API endpoint that powers the application.
    It receives the trip data from the frontend and orchestrates the entire process.
    """
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    def create(self, request, *args, **kwargs):
        """
        Handles the POST request to create a new trip and generate HOS logs.
        """
        # Validate the incoming data from the frontend form.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        
        # Convert location names into coordinates using our helper function.
        current_coords = get_coords(validated_data.get('current_location'))
        pickup_coords = get_coords(validated_data.get('pickup_location'))
        dropoff_coords = get_coords(validated_data.get('dropoff_location'))

        # Calculate the distance for each separate leg of the journey.
        # This is critical for creating a realistic, multi-part driving log.
        leg1_route_info = get_route_and_distance(current_coords, pickup_coords)
        leg2_route_info = get_route_and_distance(pickup_coords, dropoff_coords)
        
        leg1_miles = leg1_route_info['distance']
        leg2_miles = leg2_route_info['distance']
        total_miles = leg1_miles + leg2_miles
        
        # Combine the route lines from both legs for a continuous map display.
        full_route_points = leg1_route_info['route'] + leg2_route_info['route'][1:]

        # Save the initial trip data to the database.
        validated_data['total_miles'] = total_miles
        trip_instance = Trip.objects.create(**validated_data)
        
        # Call the main HOS simulation function from hos_utils.py.
        # This is where the core logic happens.
        hos_logs = calculate_hos(trip_instance, leg1_miles, leg2_miles)

        # Post-processing: Calculate the trip's end date based on the simulation results.
        if hos_logs:
            number_of_days = len(hos_logs)
            trip_duration = timedelta(days=number_of_days - 1)
            trip_instance.end_date = trip_instance.start_date + trip_duration
            trip_instance.save() # Update the database record with the end date.
        
        # Generate the list of map markers (stops) based on the simulation logs.
        stops = []
        if current_coords: stops.append({"coords": current_coords, "label": f"Start: {trip_instance.current_location}", "type": "current"})
        if pickup_coords: stops.append({"coords": pickup_coords, "label": f"Pickup: {trip_instance.pickup_location}", "type": "pickup"})

        cumulative_miles = 0
        for i, day_log in enumerate(hos_logs):
            # Check for fuel stops within this day's log entries to place a marker.
            if day_log.get('fuel_stop_hours', 0) > 0:
                # Use a heuristic to place the fuel stop marker roughly mid-way through the day's drive.
                miles_at_fuel_stop = cumulative_miles + (day_log['driving'] / 2) * AVERAGE_DRIVING_SPEED_MPH
                progress_ratio = miles_at_fuel_stop / total_miles if total_miles > 0 else 0
                stop_index = min(int(len(full_route_points) * progress_ratio), len(full_route_points) - 1)
                stops.append({"coords": full_route_points[stop_index], "label": "Fuel Stop", "type": "fuel"})

            daily_miles = day_log['driving'] * AVERAGE_DRIVING_SPEED_MPH
            cumulative_miles += daily_miles

            # Add an "End of Day Rest" marker, but only for multi-day trips.
            is_last_day = (i == len(hos_logs) - 1)
            if not is_last_day:
                progress_ratio = cumulative_miles / total_miles if total_miles > 0 else 0
                stop_index = min(int(len(full_route_points) * progress_ratio), len(full_route_points) - 1)
                stops.append({"coords": full_route_points[stop_index], "label": f"End of Day {day_log['day_number']} Rest", "type": "rest"})
        
        if dropoff_coords: stops.append({"coords": dropoff_coords, "label": f"Dropoff: {trip_instance.dropoff_location}", "type": "dropoff"})
        
        # Prepare the final JSON response to send back to the frontend.
        # Re-serialize the trip data to include the calculated end_date.
        trip_data = TripSerializer(trip_instance).data
        trip_data['route_points'] = full_route_points
        trip_data['stops'] = stops

        return Response({
            "trip": trip_data,
            "hos_logs": hos_logs
        })