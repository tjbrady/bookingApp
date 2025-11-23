import React, { useMemo } from 'react';

const colors = ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];
const years = [2026, 2027, 2028, 2029];

const ScheduleSummaryTable = ({ schedule }) => {
  const weeklyCounts = useMemo(() => {
    const counts = {};
    // Initialize counts
    colors.forEach(color => {
      counts[color] = {};
      years.forEach(year => {
        counts[color][year] = 0;
      });
    });

    if (schedule && typeof schedule === 'object') {
      // Iterate over years in the schedule object
      Object.keys(schedule).forEach(yearStr => {
        const yearNum = parseInt(yearStr);
        if (years.includes(yearNum)) {
          // Iterate over colors for that year
          Object.keys(schedule[yearNum]).forEach(color => {
            if (colors.includes(color)) {
              // Iterate over the date range entries for that color
              schedule[yearNum][color].forEach(entry => {
                if (entry.startDate && entry.endDate) {
                  try {
                    let currentDate = new Date(entry.startDate);
                    const endDate = new Date(entry.endDate);
                    
                    // This loop counts each week within the range
                    while(currentDate <= endDate) {
                        const currentYear = currentDate.getFullYear();
                        if (currentYear === yearNum) {
                            counts[color][yearNum]++;
                        }
                        // Move to the next week
                        currentDate.setDate(currentDate.getDate() + 7);
                    }
                  } catch (e) {
                      console.error("Invalid date found in schedule for summary", e);
                  }
                }
              });
            }
          });
        }
      });
    }
    
    return counts;
  }, [schedule]);

  const yearlyTotals = useMemo(() => {
    const totals = {};
    years.forEach(year => {
      totals[year] = 0;
      colors.forEach(color => {
        totals[year] += weeklyCounts[color][year];
      });
    });
    return totals;
  }, [weeklyCounts]);

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3>Schedule Summary (Weeks per Year)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Colour</th>
            {years.map(year => <th key={year} style={{ padding: '8px' }}>{year}</th>)}
          </tr>
        </thead>
        <tbody>
          {colors.map(color => (
            <tr key={color} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold', color: color.toLowerCase() }}>{color}</td>
              {years.map(year => (
                <td key={`${color}-${year}`} style={{ padding: '8px' }}>{weeklyCounts[color][year]}</td>
              ))}
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
            <td style={{ textAlign: 'left', padding: '8px' }}>Totals</td>
            {years.map(year => (
              <td key={`total-${year}`} style={{ padding: '8px' }}>{yearlyTotals[year]}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
};

export default ScheduleSummaryTable;
