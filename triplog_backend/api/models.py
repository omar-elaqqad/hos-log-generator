# api/models.py

from django.db import models

class Trip(models.Model):
    """
    Represents a single trip plan in the database.
    This model stores both the user's inputs and the server-calculated results.
    """
    # Fields provided by the user via the frontend form
    current_location = models.CharField(max_length=200)
    pickup_location = models.CharField(max_length=200)
    dropoff_location = models.CharField(max_length=200)
    current_cycle_used_hours = models.FloatField()
    start_date = models.DateField()
    
    # Fields calculated by the server in views.py ---
    end_date = models.DateField(null=True, blank=True)
    # The total miles is calculated by calling the OSRM routing API.
    total_miles = models.FloatField(default=0)
    
    # Records the exact time when the trip was first created.
    created_at = models.DateTimeField(auto_now_add=True)
    # Records the time of the last update to this trip record.
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Provides a human-readable string representation of the Trip object,
        which is useful in the Django admin interface.
        """
        return f"{self.current_location} → {self.dropoff_location}"