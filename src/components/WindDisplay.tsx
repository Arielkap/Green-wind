import React, { useState, useEffect } from 'react';

interface WindData {
  currentConditions: {
    windspeed: number;
    windgust: number;
    winddir: number;
  };
}

export const WindDisplay: React.FC = () => {
  const [windData, setWindData] = useState<WindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_API_KEY; // API key should be in .env file

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/kelme?unitGroup=metric&key=${API_KEY}&contentType=json`
        );
        
        if (!response.ok) {
          throw new Error('Data fetch failed');
        }
        
        const data = await response.json();
        setWindData(data);
        setLoading(false);
      } catch (err) {
        setError('Unable to fetch wind data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!windData) return null;

  return (
    <div className="wind-display">
      <div className="wind-card">
        <h2>Current Wind Conditions</h2>
        <div className="wind-info">
          <div className="wind-item">
            <span className="label">Wind Speed</span>
            <span className="value">{windData.currentConditions.windspeed} km/h</span>
          </div>
          <div className="wind-item">
            <span className="label">Wind Gusts</span>
            <span className="value">{windData.currentConditions.windgust} km/h</span>
          </div>
          <div className="wind-item">
            <span className="label">Wind Direction</span>
            <span className="value">{windData.currentConditions.winddir}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 