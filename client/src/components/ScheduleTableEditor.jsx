import React from 'react';

const colors = ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];
const years = [2026, 2027, 2028, 2029];

const ScheduleTableEditor = ({ schedule, setSchedule, onSave, loading }) => {

  const handleDateChange = (year, color, index, field, value) => {
    const newSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy
    if (newSchedule[year] && newSchedule[year][color] && newSchedule[year][color][index]) {
      newSchedule[year][color][index][field] = value;
      setSchedule(newSchedule);
    }
  };

  if (!schedule || Object.keys(schedule).length === 0) {
    return <p>Loading schedule data...</p>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <p>Enter the start and end dates for each color-coded booking period. Each color has 3 available slots per year.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Colour</th>
            {years.map(year => (
              <th key={year} style={{ padding: '8px', textAlign: 'center' }}>{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colors.map(color => (
            <React.Fragment key={color}>
              {/* Create 3 rows for each color */}
              {[0, 1, 2].map(index => (
                <tr key={`${color}-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                  {/* The color name only appears on the first row of its set */}
                  {index === 0 && (
                    <td rowSpan={3} style={{ verticalAlign: 'top', fontWeight: 'bold', padding: '8px', borderRight: '1px solid #ddd' }}>
                      {color}
                    </td>
                  )}
                  {/* Year columns */}
                  {years.map(year => (
                    <td key={`${color}-${year}-${index}`} style={{ padding: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8em' }}>Start:</label>
                        <input
                          type="date"
                          value={schedule[year]?.[color]?.[index]?.startDate || ''}
                          onChange={(e) => handleDateChange(year, color, index, 'startDate', e.target.value)}
                          style={{ padding: '4px', fontSize: '0.9em' }}
                        />
                        <label style={{ fontSize: '0.8em', marginTop: '4px' }}>End:</label>
                        <input
                          type="date"
                          value={schedule[year]?.[color]?.[index]?.endDate || ''}
                          onChange={(e) => handleDateChange(year, color, index, 'endDate', e.target.value)}
                          style={{ padding: '4px', fontSize: '0.9em' }}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {years.map(year => (
          <button 
            key={year}
            onClick={() => onSave(year, schedule)} 
            style={{ padding: '10px 20px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : `Save ${year} Changes`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScheduleTableEditor;
