import React, { useState, useEffect } from 'react';

const colors = ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];

const ScheduleTableEditor = ({ schedule, setSchedule, onSave, loading }) => {
  const [years, setYears] = useState([]);

  useEffect(() => {
    if (schedule && Object.keys(schedule).length > 0) {
      // Extract existing years from the schedule object and sort descending
      const existingYears = Object.keys(schedule).map(Number).sort((a, b) => b - a);
      setYears(existingYears);
    }
  }, [schedule]);

  const handleAddYear = () => {
    const nextYear = years.length > 0 ? Math.max(...years) + 1 : new Date().getFullYear();
    
    // Initialize the new year in the schedule state
    const newSchedule = { ...schedule };
    newSchedule[nextYear] = {};
    colors.forEach(color => {
      newSchedule[nextYear][color] = [
        { startDate: '', endDate: '' },
        { startDate: '', endDate: '' },
        { startDate: '', endDate: '' }
      ];
    });
    
    setSchedule(newSchedule);
    setYears([nextYear, ...years]); // Add to the left
  };

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
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <p style={{ margin: 0 }}>Enter the start and end dates for each color-coded booking period. Each color has 3 available slots per year.</p>
        <button 
          onClick={handleAddYear}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Add Year {years.length > 0 ? Math.max(...years) + 1 : ''}
        </button>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', backgroundColor: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '12px', borderRight: '1px solid #ddd', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>Colour</th>
              {years.map(year => (
                <th key={year} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #ddd' }}>{year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color, colorIndex) => (
              <React.Fragment key={color}>
                {[0, 1, 2].map(index => (
                  <tr key={`${color}-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                    {index === 0 && (
                      <td rowSpan={3} style={{ 
                        verticalAlign: 'top', 
                        fontWeight: 'bold', 
                        padding: '12px', 
                        borderRight: '1px solid #ddd',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'white',
                        zIndex: 5
                      }}>
                        {color}
                      </td>
                    )}
                    {years.map((year, yearIndex) => {
                      const baseTabIndex = 1 + (yearIndex * 30) + (colorIndex * 6) + (index * 2);
                      
                      return (
                        <td key={`${color}-${year}-${index}`} style={{ padding: '8px', borderRight: '1px solid #ddd' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <label style={{ fontSize: '0.75em', minWidth: '35px' }}>Start:</label>
                              <input
                                type="date"
                                tabIndex={baseTabIndex}
                                value={schedule[year]?.[color]?.[index]?.startDate || ''}
                                onChange={(e) => handleDateChange(year, color, index, 'startDate', e.target.value)}
                                style={{ padding: '4px', fontSize: '0.85em', width: '100%' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <label style={{ fontSize: '0.75em', minWidth: '35px' }}>End:</label>
                              <input
                                type="date"
                                tabIndex={baseTabIndex + 1}
                                value={schedule[year]?.[color]?.[index]?.endDate || ''}
                                onChange={(e) => handleDateChange(year, color, index, 'endDate', e.target.value)}
                                style={{ padding: '4px', fontSize: '0.85em', width: '100%' }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {years.map(year => (
          <button 
            key={year}
            onClick={() => onSave(year, schedule)} 
            style={{ 
              padding: '10px 20px', 
              fontSize: '0.9rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
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
