from django.urls import path
from .views import TripListCreateView

urlpatterns = [
    path('trips/', TripListCreateView.as_view(), name='trip-list-create'),
]
