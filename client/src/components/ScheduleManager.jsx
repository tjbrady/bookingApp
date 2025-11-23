import React, { useState, useEffect } from 'react';
import api from '../services/api';

const colourMap = { // Changed to colourMap
  Red: '#ffcccb',
  Blue: '#add8e6',
  Orange: '#ffd700',
  Yellow: '#ffffe0',
  Green: '#90ee90',
};

// Helper to get the start of the week (Sunday) for a given date
const getStartOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

const ScheduleManager = ({ schedule: propSchedule, setSchedule: setPropSchedule, onSave, loading }) => {
  const [year, setYear] = useState(2026);
  const [selectedColour, setSelectedColour] = useState('Red');
  const colours = ['Red', 'Blue', 'Orange', 'Yellow', 'Green'];

  console.log('ScheduleManager received schedule:', propSchedule); // For debugging

  // Convert propSchedule array to a map for easier lookup in renderMonth
  // This memoized value will update when propSchedule changes
  const scheduleMap = React.useMemo(() => {
    if (!Array.isArray(propSchedule)) return {};
    return propSchedule.reduce((acc, entry) => {
      const dateKey = new Date(entry.startDate).toISOString().substring(0, 10); // Ensure consistent date key
      acc[dateKey] = entry.color;
      return acc;
    }, {});
  }, [propSchedule]);


  const handleWeekClick = (weekStartDate) => {
    const dateKey = weekStartDate.toISOString().substring(0, 10);
    // Determine the new color for this week
    const newColor = scheduleMap[dateKey] === selectedColour ? '' : selectedColour;

    // Remove existing entry for this week if it exists
    const filteredSchedule = propSchedule.filter(entry => 
      new Date(entry.startDate).toISOString().substring(0, 10) !== dateKey
    );

    let newSchedule = filteredSchedule;
    // Add a new entry if a color is being applied
    if (newColor) {
      const newScheduleEntry = {
        startDate: weekStartDate.toISOString(),
        endDate: new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        color: newColor,
      };
      newSchedule = [...filteredSchedule, newScheduleEntry];
    }
    
    console.log('handleWeekClick:', { dateKey, newColor, newSchedule }); // For debugging
    setPropSchedule(newSchedule);
  };

  const handleSave = async () => {
    // onSave prop expects the schedule data in the format AdminDashboard expects (array of objects)
    await onSave(propSchedule);
  };

  const renderMonth = (monthIndex) => {
    const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startingDay = firstDay.getDay();

    const days = Array.from({ length: startingDay }, (_, i) => <div key={`empty-${i}`}></div>);
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        const weekStart = getStartOfWeek(date);
        const weekKey = weekStart.toISOString().substring(0, 10);
        const colour = scheduleMap[weekKey] || ''; // Use the memoized map
        days.push(
            <div 
                key={day}
                onClick={() => handleWeekClick(weekStart)}
                style={{ 
                    backgroundColor: colour ? colourMap[colour] : '#fff',
                    border: '1px solid #eee',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
                title={`Week starting ${weekStart.toLocaleDateString()}`}
            >
                {day}
            </div>
        );
    }

    return (
        <div key={monthIndex}>
            <h4 style={{textAlign: 'center'}}>{monthName}</h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px'}}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} style={{fontWeight: 'bold', textAlign: 'center'}}>{d}</div>)}
                {days}
            </div>
        </div>
    );
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div>
        <strong>Select a colour to "paint" weeks:</strong>
        <select value={selectedColour} onChange={(e) => setSelectedColour(e.target.value)}>
          {colours.map(c => c === '' ? null : <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setSelectedColour('')} style={{marginLeft: '10px'}}>Eraser (Set to None)</button>
      </div>

      <div style={{ margin: '1rem 0', textAlign: 'center' }}>
        <button onClick={() => setYear(year - 1)}>◄ Previous Year</button>
        <strong style={{ margin: '0 1rem', fontSize: '1.5em' }}>{year}</strong>
        <button onClick={() => setYear(year + 1)}>Next Year ►</button>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>

      <button 
        onClick={handleSave} 
        style={{ marginTop: '1rem', padding: '10px 20px', fontSize: '1.2rem' }}
        disabled={loading} // Use loading prop from AdminDashboard
      >
        {loading ? 'Saving...' : 'Save Entire Schedule'}
      </button>
    </div>
  );
};

export default ScheduleManager;