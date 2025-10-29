/* src/components/DailyLogTable.jsx */

import React from "react";
import DailyLogSheetSVG from "./DailyLogSheetSVG";
import { FaTruck, FaUserClock, FaBed, FaCoffee, FaGasPump } from 'react-icons/fa';
import { MdTimerOff } from 'react-icons/md';
import "../styles/main.css";

/* A small, reusable component for displaying a single summary statistic with an icon. */
const SummaryStat = ({ icon, value, unit, label }) => (
  /* The 'title' attribute provides a tooltip on hover*/
  <div className="summary-stat" title={label}>
    <div className="summary-icon">{icon}</div>
    <div className="summary-value">
      {value} <span className="summary-unit">{unit}</span>
    </div>
  </div>
);

/* A configuration object to map backend data keys to their corresponding UI elements. */
const summaryConfig = {
    driving: { icon: <FaTruck />, label: 'Driving', unit: 'h' },
    on_duty_not_driving: { icon: <FaUserClock />, label: 'On Duty', unit: 'h' },
    off_duty: { icon: <MdTimerOff />, label: 'Off Duty', unit: 'h' },
    sleeper: { icon: <FaBed />, label: 'Sleeper', unit: 'h' },
    break_taken_minutes: { icon: <FaCoffee />, label: 'Break', unit: 'min' },
    fuel_stop_hours: { icon: <FaGasPump />, label: 'Fuel Stop', unit: 'h' }
};

/* This component is responsible for displaying the list of all daily logs for the trip. */
const DailyLogTable = ({ hosLogs }) => {
  if (!hosLogs || hosLogs.length === 0) {
    return <p>No HOS logs to display.</p>;
  }

  return (
    <div>
      {/* It maps over the array of daily logs received from the backend. */}
      {hosLogs.map((day, idx) => {
          /* This logic dynamically shows only the stats that have a value greater than 0. */
          const statsToDisplay = Object.keys(summaryConfig).filter(key => day[key] !== undefined && day[key] > 0);

          return (
            /* For each day, it renders a 'log-card' container. */
            <div key={idx} className="log-card">
              <h3>
                Day {day.day_number}: {day.date}
              </h3>

              {/* It delegates the drawing of the graph to the specialized SVG component. */}
              <DailyLogSheetSVG entries={day.entries} />

              {/* It renders the container for the summary statistics. */}
              <div className="summary-container">
                {statsToDisplay.map(key => (
                    <SummaryStat
                        key={key}
                        icon={summaryConfig[key].icon}
                        label={summaryConfig[key].label}
                        value={day[key]}
                        unit={summaryConfig[key].unit}
                    />
                ))}
              </div>
            </div>
          )
      })}
    </div>
  );
};

export default DailyLogTable;