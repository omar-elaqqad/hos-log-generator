# api/serializers.py

from rest_framework import serializers
from .models import Trip

class TripSerializer(serializers.ModelSerializer):
    """
    Translates the `Trip` model data into a simple JSON format.
    
    This serializer is responsible for converting Python objects from the database
    into JSON that can be sent to the frontend, and vice-versa.
    """
    class Meta:
        # Specifies which database model this serializer is linked to.
        model = Trip
        # Includes all fields from the Trip model in the JSON output.
        fields = "__all__"
        
        # Defines fields that are calculated by the server, not provided by the client.
        read_only_fields = [
            'end_date', 
            'total_miles', 
            'created_at', 
            'updated_at'
        ]