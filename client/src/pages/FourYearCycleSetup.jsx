import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ScheduleTableEditor from '../components/ScheduleTableEditor';
import ScheduleSummaryTable from '../components/ScheduleSummaryTable'; // Import summary table
import { AuthContext } from '../context/AuthContext.jsx';

// This function transforms the flat array from the API into the nested object structure
const transformScheduleToStructured = (flatSchedule) => {
    const years = [2026, 2027, 2028, 2029];
    const colors = ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];
    const defaultEntry = { startDate: '', endDate: '' };

    const structured = {};
    years.forEach(year => {
        structured[year] = {};
        colors.forEach(color => {
            structured[year][color] = [
                { ...defaultEntry }, { ...defaultEntry }, { ...defaultEntry }
            ];
        });
    });

    const colorRowIndex = {};
    colors.forEach(color => colorRowIndex[color] = 0);
    
    if(Array.isArray(flatSchedule)) {
        flatSchedule.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        flatSchedule.forEach(entry => {
            const year = new Date(entry.startDate).getFullYear();
            if (structured[year] && structured[year][entry.color]) {
                const index = colorRowIndex[entry.color] || 0;
                if (index < structured[year][entry.color].length) {
                    structured[year][entry.color][index] = {
                        startDate: new Date(entry.startDate).toISOString().substring(0, 10),
                        endDate: new Date(entry.endDate).toISOString().substring(0, 10),
                    };
                    colorRowIndex[entry.color]++;
                }
            }
        });
    }

    return structured;
};


const FourYearCycleSetup = () => {
  const [schedule, setSchedule] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const scheduleRes = await api.get('/admin/schedule');
      const structuredSchedule = transformScheduleToStructured(scheduleRes.data);
      setSchedule(structuredSchedule);
    } catch (err) {
      setError('Failed to fetch schedule data.');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSaveSchedule = async (yearToSave, fullSchedule) => {
    setLoadingData(true);
    try {
      // Extract and flatten only the data for the year being saved
      const yearData = fullSchedule[yearToSave];
      const flatScheduleForYear = [];
      Object.keys(yearData).forEach(color => {
        yearData[color].forEach(entry => {
          if (entry.startDate && entry.endDate) {
            flatScheduleForYear.push({
              color: color,
              startDate: entry.startDate,
              endDate: entry.endDate,
            });
          }
        });
      });

      // Call the new year-specific endpoint
      await api.post(`/admin/schedule/year/${yearToSave}`, flatScheduleForYear);
      alert(`Schedule for ${yearToSave} saved successfully!`);
      await fetchData(); // Refetch all data to ensure consistency
    } catch (err) {
      setError(`Failed to save schedule for ${yearToSave}.`);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) return <p>Loading setup page...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2 style={{display: 'inline-block', marginRight: '1rem'}}>4 Year Cycle Setup</h2>
      
      <ScheduleSummaryTable schedule={schedule} />

      <hr style={{ margin: '2rem 0' }} />

      <section>
        <h3>Colour Schedule Management</h3>
        <p>
          This table is for the rare task of setting up the entire 4-year rolling schedule. 
          Enter the start and end dates for each of the three blocks allocated to each colour per year.
        </p>
        <ScheduleTableEditor
          schedule={schedule}
          setSchedule={setSchedule}
          onSave={handleSaveSchedule}
          loading={loadingData}
        />
      </section>
    </div>
  );
};

export default FourYearCycleSetup;
