/* src/components/DailyLogSheetSVG.jsx */

import React from "react";

/* The labels displayed on the left side of the grid. */
const categoryLabels = [
  "1: OFF DUTY",
  "2: SLEEPER BERTH",
  "3: DRIVING",
  "4: ON DUTY\n(NOT DRIVING)",
];

/* Maps the category names from the backend data to a specific Y-axis pixel position. */
const categoryY = {
  "off_duty": 25,
  "sleeper": 75,
  "driving": 125,
  "on_duty_not_driving": 175,
};

/* Defines the dimensions and colors of the SVG grid for a consistent look. */
const hourWidth = 40; /* The width in pixels of one hour on the grid. */
const totalWidth = 24 * hourWidth;
const svgHeight = 200;
const gridLineColor = "#a9c4e2";
const textColor = "#002366";

/* Converts the array of log entries into a string of points for an SVG polyline. */
const buildPathPoints = (entries) => {
  if (!entries || entries.length === 0) return "";
  const points = [];

  entries.forEach((entry, i) => {
    const y = categoryY[entry.category];
    if (y === undefined) { 
      console.error(`Invalid category found in log entries: "${entry.category}"`);
      return;
    }

    /* Convert the start and end hours (e.g., 6.25) into pixel coordinates. */
    const xStart = entry.start * hourWidth;
    const xEnd = Math.min(entry.end, 24) * hourWidth;

    if (i === 0) {
      /* For the first entry, just move to the starting point. */
      points.push(`${xStart},${y}`);
    } else {
      /* For subsequent entries, draw a vertical line from the previous state to the new one. */
      const prev = entries[i - 1];
      const prevY = categoryY[prev.category];
      points.push(`${xStart},${prevY}`); 
      points.push(`${xStart},${y}`); 
    }
    /* Draw the horizontal line representing the duration of the current activity. */
    points.push(`${xEnd},${y}`); 
  });

  return points.join(" ");
};

/* Helper function to generate the array of time labels ('Midnight', '1', '2', ..., 'noon'). */
const generateTimeLabels = () => {
  const labels = ['Midnight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'noon'];
  const pmLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  return [...labels, ...pmLabels];
};

/* A small component to render the row of time labels either at the top or bottom of the grid. */
const TimeLabelsRow = ({ position }) => (
  <div style={{ display: 'flex', paddingLeft: '110px' }}>
    {generateTimeLabels().map((label, i) => (
      <div key={`${position}-${i}`} style={{
        width: hourWidth,
        textAlign: 'center',
        fontSize: '12px',
        color: textColor,
      }}>
        {label}
      </div>
    ))}
  </div>
);

/* This is the main component responsible for rendering the entire log sheet graph. */
const DailyLogSheetSVG = ({ entries }) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return <div style={{ border: '1px solid #ccc', padding: '20px', color: 'red' }}>No log entries available to display.</div>;
  }

  /* Call the helper function to get the path for the black line. */
  const path = buildPathPoints(entries);
  
  /* The JSX here assembles the different parts: time labels, category labels, and the SVG grid itself. */
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <TimeLabelsRow position="top" />
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Renders the text labels on the left side (e.g., "1: OFF DUTY"). */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
          width: '110px', flexShrink: 0, fontSize: '13px', color: textColor,
          textAlign: 'left', paddingLeft: '5px'
        }}>
          {categoryLabels.map((cat, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>{cat}</div>
          ))}
        </div>

        {/* This div contains the SVG element where the actual drawing happens. */}
        <div style={{ width: totalWidth, border: `2px solid ${gridLineColor}`, borderTop: 'none' }}>
          <svg width={totalWidth} height={svgHeight} style={{ display: 'block' }}>
            {/* Draws the horizontal lines for the grid. */}
            {[...Array(5)].map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 50} x2={totalWidth} y2={i * 50} stroke={gridLineColor} strokeWidth={i === 0 || i === 4 ? '2' : '1'} />
            ))}

            {/* Draws the vertical lines and the small 15-minute tick marks for the grid. */}
            {[...Array(24)].map((_, hour) => (
              <g key={`hour-${hour}`}>
                <line x1={(hour + 1) * hourWidth} y1="0" x2={(hour + 1) * hourWidth} y2={svgHeight} stroke={gridLineColor} strokeWidth="1" />
                {[1, 2, 3].map(quarter => {
                  const x = hour * hourWidth + quarter * (hourWidth / 4);
                  const tickHeight = (quarter === 2) ? 15 : 10;
                  return (
                    <g key={`q-${hour}-${quarter}`}>
                      {Object.values(categoryY).map(yPos => (
                        <line key={`${yPos}-${x}`} x1={x} y1={yPos - tickHeight} x2={x} y2={yPos} stroke={gridLineColor} strokeWidth="1" />
                      ))}
                    </g>
                  );
                })}
              </g>
            ))}
            
            {/* Finally, draws the main black line representing the driver's activity. */}
            <polyline points={path} stroke="black" strokeWidth="3" fill="none" />
          </svg>
        </div>
      </div>
      <TimeLabelsRow position="bottom" />
    </div>
  );
};

export default DailyLogSheetSVG;