# api/hos_utils.py

from datetime import timedelta
from collections import deque

# --- HOS Regulation and Trip Assumption Constants ---
# These constants define the rules of the simulation according to FMCSA regulations.
MAX_DRIVING_HOURS_PER_SHIFT = 11
MAX_DUTY_HOURS_PER_SHIFT = 14
REQUIRED_BREAK_AFTER_HOURS = 8
BREAK_DURATION_HOURS = 0.5
AVERAGE_DRIVING_SPEED_MPH = 55
PICKUP_TIME_HOURS = 1.0
DROPOFF_TIME_HOURS = 1.0
FUELING_INTERVAL_MILES = 1000
FUELING_TIME_HOURS = 0.75
PRE_TRIP_INSPECTION_HOURS = 0.25
POST_TRIP_INSPECTION_HOURS = 0.25
MAX_CYCLE_HOURS = 70.0

def calculate_hos(trip, leg1_miles, leg2_miles):
    """
    Simulates a multi-day truck trip to generate accurate Hours of Service logs.
    
    This function uses an event-based queue to process trip tasks sequentially,
    applying all federal HOS rules (11h driving, 14h duty, 70h cycle, 30min break)
    to produce a day-by-day breakdown of the driver's time.
    """
    
    # Build the chronological list of tasks for the entire trip.
    # A deque is used as an efficient queue to process events in order.
    events = deque()
    events.append({'type': 'on_duty', 'duration': PRE_TRIP_INSPECTION_HOURS, 'task': 'Pre-Trip'})
    events.append({'type': 'drive', 'miles': leg1_miles})
    events.append({'type': 'on_duty', 'duration': PICKUP_TIME_HOURS, 'task': 'Pickup'})
    events.append({'type': 'drive', 'miles': leg2_miles})
    events.append({'type': 'on_duty', 'duration': DROPOFF_TIME_HOURS, 'task': 'Dropoff'})
    events.append({'type': 'on_duty', 'duration': POST_TRIP_INSPECTION_HOURS, 'task': 'Post-Trip'})

    # Initialize state variables for the entire trip simulation ---
    daily_logs = []
    current_day_index = 0
    cycle_hours_remaining = MAX_CYCLE_HOURS - trip.current_cycle_used_hours
    total_miles_driven_since_fuel = 0

    # Main simulation loop: continues day by day until all events are completed.
    while events:
        current_day_index += 1
        
        # Initialize state variables that reset for each new day/shift ---
        day_entries = []
        current_time_in_day = 6.0 # Assume driver starts their shift at 6 AM.
        day_entries.append({'start': 0.0, 'end': current_time_in_day, 'category': 'off_duty'})
        
        duty_window_hours_used = 0
        driving_hours_used_in_shift = 0
        driving_hours_since_break = 0
        break_taken_minutes_today = 0
        fuel_stops_today = 0

        # Helper function to add a new activity to the daily log graph.
        def add_entry(duration, category):
            nonlocal current_time_in_day
            start = current_time_in_day
            end = start + duration
            day_entries.append({'start': start, 'end': end, 'category': category})
            current_time_in_day = end

        # Daily work loop: processes events from the queue until the driver runs out of hours.
        shift_is_over = False
        while not shift_is_over and events:
            # First, check if the driver has hit any HOS limit. If so, end the shift.
            if duty_window_hours_used >= MAX_DUTY_HOURS_PER_SHIFT or \
               driving_hours_used_in_shift >= MAX_DRIVING_HOURS_PER_SHIFT or \
               cycle_hours_remaining <= 0:
                shift_is_over = True
                continue

            # Second, check for mandatory events like fueling.
            if total_miles_driven_since_fuel >= FUELING_INTERVAL_MILES:
                add_entry(FUELING_TIME_HOURS, 'on_duty_not_driving')
                duty_window_hours_used += FUELING_TIME_HOURS
                cycle_hours_remaining -= FUELING_TIME_HOURS
                total_miles_driven_since_fuel = 0
                fuel_stops_today += 1
                continue

            # Process the next event from the queue.
            event = events[0]

            if event['type'] == 'on_duty':
                # Handle non-driving work (e.g., pickup, dropoff).
                add_entry(event['duration'], 'on_duty_not_driving')
                duty_window_hours_used += event['duration']
                cycle_hours_remaining -= event['duration']
                events.popleft()

            elif event['type'] == 'drive':
                # Handle driving segments, which are more complex.
                # First, check if a mandatory 30-minute break is required.
                if driving_hours_since_break >= REQUIRED_BREAK_AFTER_HOURS:
                    add_entry(BREAK_DURATION_HOURS, 'off_duty')
                    driving_hours_since_break = 0
                    break_taken_minutes_today += 30
                    continue

                # Calculate the maximum time the driver can drive before hitting any limit.
                max_drive_duration = min(
                    MAX_DRIVING_HOURS_PER_SHIFT - driving_hours_used_in_shift,
                    MAX_DUTY_HOURS_PER_SHIFT - duty_window_hours_used,
                    REQUIRED_BREAK_AFTER_HOURS - driving_hours_since_break,
                    cycle_hours_remaining
                )
                
                time_needed_for_leg = event['miles'] / AVERAGE_DRIVING_SPEED_MPH

                # Determine if the entire driving leg can be completed in this shift.
                if time_needed_for_leg <= max_drive_duration:
                    driving_duration = time_needed_for_leg
                    events.popleft() # Entire leg is complete.
                else:
                    # If not, drive for the max possible time and update the remaining miles.
                    driving_duration = max_drive_duration
                    miles_driven = driving_duration * AVERAGE_DRIVING_SPEED_MPH
                    event['miles'] -= miles_driven
                    total_miles_driven_since_fuel += miles_driven
                
                # Add the driving entry and update all relevant time clocks.
                add_entry(driving_duration, 'driving')
                driving_hours_used_in_shift += driving_duration
                duty_window_hours_used += driving_duration
                driving_hours_since_break += driving_duration
                cycle_hours_remaining -= driving_duration

        # End of Day Logic: Fill the rest of the 24-hour log with the correct rest status.
        remaining_day_hours = 24.0 - current_time_in_day
        if remaining_day_hours > 0:
            # If all events are done, the driver is home (Off Duty).
            if not events:
                add_entry(remaining_day_hours, 'off_duty')
            # Otherwise, the driver is on the road and must rest in the truck (Sleeper Berth).
            else:
                add_entry(min(remaining_day_hours, 10.0), 'sleeper')
                if (24.0 - current_time_in_day) > 0:
                    add_entry(24.0 - current_time_in_day, 'off_duty')

        # Finalize and format the data for the current day's log.
        totals = {cat: 0 for cat in ['driving', 'on_duty_not_driving', 'off_duty', 'sleeper']}
        for entry in day_entries:
            totals[entry['category']] += (entry['end'] - entry['start'])
            
        daily_logs.append({
            "date": (trip.start_date + timedelta(days=current_day_index - 1)).isoformat(),
            "day_number": current_day_index,
            "driving": round(totals['driving'], 2),
            "on_duty_not_driving": round(totals['on_duty_not_driving'], 2),
            "off_duty": round(totals['off_duty'], 2),
            "sleeper": round(totals['sleeper'], 2),
            "entries": day_entries,
            "break_taken_minutes": break_taken_minutes_today,
            "fuel_stop_hours": round(fuel_stops_today * FUELING_TIME_HOURS, 2)
        })
        # Failsafe to prevent potential infinite loops.
        if current_day_index > 50:
            break

    return daily_logs