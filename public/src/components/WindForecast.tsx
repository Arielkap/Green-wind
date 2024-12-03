import React, { useState, useEffect } from 'react';
import '../styles/WindForecast.css';

interface DayForecast {
  day: string;
  windSpeed: number;
  windGust: number;
  temperature: number;
  isToday: boolean;
}

interface WindData {
  currentSpeed: number;
  gustSpeed: number;
  direction: number;
  timestamp: string;
  weekForecast: DayForecast[];
  location: string;
}

interface Suggestion {
  name: string;
  country: string;
}

const API_KEY = 'YS4MB558RYJKZKKMHP4K5N9JL';
const WIND_THRESHOLD = 13.5; // m/s
const MEDIUM_WIND_THRESHOLD = 10.0; // m/s

const WindForecast: React.FC = () => {
  const [windData, setWindData] = useState<WindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(() => {
    const savedLocation = localStorage.getItem('lastLocation');
    return savedLocation || 'London';
  });
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const kmhToMs = (kmh: number): number => {
    return kmh / 3.6;
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) / 22.5));
    return directions[index % 16];
  };

  const getWindClass = (speed: number) => {
    if (speed >= WIND_THRESHOLD) return 'high-wind';
    if (speed >= MEDIUM_WIND_THRESHOLD) return 'medium-wind';
    return '';
  };

  const fetchWeatherData = async (loc: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${loc}?unitGroup=metric&key=${API_KEY}&contentType=json`
      );
      const data = await response.json();

      const formattedData: WindData = {
        currentSpeed: kmhToMs(data.currentConditions.windspeed),
        gustSpeed: kmhToMs(data.currentConditions.windgust || data.currentConditions.windspeed * 1.5),
        direction: data.currentConditions.winddir,
        timestamp: new Date().toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }),
        location: data.resolvedAddress,
        weekForecast: data.days.slice(0, 7).map((day: any, index: number) => ({
          day: new Date(day.datetime).toLocaleDateString('en-US', { weekday: 'long' }),
          windSpeed: kmhToMs(day.windspeed),
          windGust: kmhToMs(day.windgust || day.windspeed * 1.5),
          temperature: day.temp,
          isToday: index === 0
        }))
      };

      setWindData(formattedData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(location);
  }, [location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    fetchSuggestions(value);
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en`
      );
      const data = await response.json();
      if (data.results) {
        setSuggestions(
          data.results.map((result: any) => ({
            name: result.name,
            country: result.country
          }))
        );
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const newLocation = `${suggestion.name}, ${suggestion.country}`;
    setLocation(newLocation);
    localStorage.setItem('lastLocation', newLocation);
    setSearchInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="wind-forecast">
      <div className="glass-container">
        <h1 className="main-title">Wind Forecast Pro</h1>
        <div className="current-time">
          {formatDateTime(currentTime)}
        </div>

        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => {
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }, 200)}
              placeholder="Search location..."
              className="search-input"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {suggestion.name}, {suggestion.country}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {windData && (
          <>
            <h2>{windData.location}</h2>
            <div className="wind-data">
              <div className={`data-card current ${getWindClass(windData.currentSpeed)}`}>
                <span className="label">Wind Speed</span>
                <span className="value">{windData.currentSpeed.toFixed(1)}</span>
                <span className="unit">m/s</span>
              </div>
              <div className={`data-card ${getWindClass(windData.gustSpeed)}`}>
                <span className="label">Wind Gusts</span>
                <span className="value">{windData.gustSpeed.toFixed(1)}</span>
                <span className="unit">m/s</span>
              </div>
              <div className="data-card">
                <span className="label">Direction</span>
                <span className="value direction">
                  {windData.direction}° ({getWindDirection(windData.direction)})
                </span>
              </div>
            </div>

            <h3>7-Day Forecast</h3>
            <div className="forecast-grid">
              {windData.weekForecast.map((day) => (
                <div key={day.day} className={`forecast-card ${day.isToday ? 'today' : ''}`}>
                  <span className="day">{day.isToday ? 'Today' : day.day}</span>
                  <div className="forecast-data">
                    <span className="temp">{day.temperature.toFixed(1)}°C</span>
                    <div className={`wind ${getWindClass(day.windSpeed)}`}>
                      <span>Wind: {day.windSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div className={`wind ${getWindClass(day.windGust)}`}>
                      <span>Gusts: {day.windGust.toFixed(1)} m/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="author-info">
          <p>Created with ❤️ by Ariel Kapitkowski</p>
          <p>Version 1.0.0 | &copy; 2024</p>
          <a href="https://github.com/arielkapitkowski" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  );
};

export default WindForecast; 