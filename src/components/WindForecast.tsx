import React, { useState, useEffect } from 'react';
import '../styles/WindForecast.css';

interface DayForecast {
  day: string;
  windSpeed: number;
  windGust: number;
  wind120m: number;
  gust120m: number;
  wind160m: number;
  gust160m: number;
  temperature: number;
  isToday: boolean;
  conditions: string;
  icon: string;
}

interface WindData {
  currentSpeed: number;
  gustSpeed: number;
  direction: number;
  timestamp: string;
  weekForecast: DayForecast[];
  location: string;
  wind120m: number;
  gust120m: number;
  wind160m: number;
  gust160m: number;
}

interface LocationSuggestion {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

const API_KEY = 'YS4MB558RYJKZKKMHP4K5N9JL';
const WIND_THRESHOLD = 13.1;
const MEDIUM_WIND_THRESHOLD = 10.5;

const kmhToMs = (kmh: number): number => {
  return kmh / 3.6;
};

const LoadingSpinner = () => (
  <div className="loading">
    <div className="loading-spinner"></div>
    <div className="loading-text">Loading weather data...</div>
  </div>
);

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return new Date().toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const WindForecast: React.FC = () => {
  const [windData, setWindData] = useState<WindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceLoading, setForceLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('lastLocation') || 'London, UK';
  });
  const [lastSearchedLocation, setLastSearchedLocation] = useState(() => {
    return localStorage.getItem('lastLocation') || 'London, UK';
  });
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getWindClass = (speed: number): string => {
    if (speed >= WIND_THRESHOLD) return 'high-wind';
    if (speed >= MEDIUM_WIND_THRESHOLD) return 'medium-wind';
    return '';
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setError(null);
    
    if (value.length >= 2) {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=5&language=en&format=json`
        );
        const data = await response.json();
        if (data.results) {
          setSuggestions(data.results.map((result: any) => ({
            name: result.name,
            country: result.country,
            lat: result.latitude,
            lon: result.longitude
          })));
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
      searchInputRef.current?.blur();
      return;
    }

    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = suggestions[selectedIndex];
          handleSuggestionClick(selected);
        } else if (searchQuery.trim()) {
          setLastSearchedLocation(searchQuery.trim());
          localStorage.setItem('lastLocation', searchQuery.trim());
          fetchWeatherData(searchQuery.trim());
          setSuggestions([]);
          searchInputRef.current?.blur();
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const location = `${suggestion.lat},${suggestion.lon}`;
    const displayLocation = `${suggestion.name}, ${suggestion.country}`;
    setSearchQuery(displayLocation);
    setLastSearchedLocation(displayLocation);
    localStorage.setItem('lastLocation', displayLocation);
    fetchWeatherData(location);
    setSuggestions([]);
    setSelectedIndex(-1);
    searchInputRef.current?.blur();
  };

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setForceLoading(false);
    }, 1000);

    const savedLocation = localStorage.getItem('lastLocation') || 'London, UK';
    setSearchQuery(savedLocation);
    fetchWeatherData(savedLocation);

    return () => clearTimeout(loadingTimer);
  }, []);

  const getWeatherIcon = (conditions: string): string => {
    const condition = conditions.toLowerCase();
    
    // Rain conditions
    if (condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle')) {
      return '🌧️';
    }
    // Snow conditions
    if (condition.includes('snow') || condition.includes('sleet') || condition.includes('ice')) {
      return '🌨️';
    }
    // Cloudy conditions
    if (condition.includes('overcast') || condition.includes('cloudy')) {
      return '☁️';
    }
    // Partly cloudy
    if (condition.includes('partly-cloudy') || condition.includes('scattered clouds')) {
      return '⛅';
    }
    // Storm conditions
    if (condition.includes('thunder') || condition.includes('storm') || condition.includes('lightning')) {
      return '⛈️';
    }
    // Fog conditions
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
      return '🌫️';
    }
    // Wind conditions
    if (condition.includes('wind') || condition.includes('breezy') || condition.includes('gust')) {
      return '💨';
    }
    // Clear/Sunny conditions
    if (condition.includes('sun') || condition.includes('clear')) {
      return '☀️';
    }
    // Default to partly cloudy if condition is unknown
    return '⛅';
  };

  const fetchWeatherData = async (loc: string) => {
    setLoading(true);
    setForceLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(loc)}?unitGroup=metric&key=${API_KEY}&contentType=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();

      const currentWindSpeed = kmhToMs(data.currentConditions.windspeed);
      const currentGustSpeed = kmhToMs(data.currentConditions.windgust || data.currentConditions.windspeed);
      
      // Calculate wind speeds at different heights
      const wind120m = currentWindSpeed * 1.2;
      const gust120m = currentGustSpeed * 1.2;
      const wind160m = currentWindSpeed * 1.5;
      const gust160m = currentGustSpeed * 1.5;

      const windDirection = data.currentConditions.winddir;
      const currentTime = formatDateTime(data.currentConditions.datetime);

      const forecastData = data.days.slice(0, 8).map((day: any, index: number) => {
        const baseWindSpeed = kmhToMs(day.windspeed);
        const baseGustSpeed = kmhToMs(day.windgust || day.windspeed);
        
        return {
          day: new Date(day.datetime).toLocaleDateString('en-GB', { weekday: 'short' }),
          windSpeed: baseWindSpeed,
          windGust: baseGustSpeed,
          wind120m: baseWindSpeed * 1.2,
          gust120m: baseGustSpeed * 1.2,
          wind160m: baseWindSpeed * 1.5,
          gust160m: baseGustSpeed * 1.5,
          temperature: day.temp,
          isToday: index === 0,
          conditions: day.conditions,
          icon: getWeatherIcon(day.conditions)
        };
      });

      const formattedData: WindData = {
        currentSpeed: currentWindSpeed,
        gustSpeed: currentGustSpeed,
        direction: windDirection,
        timestamp: currentTime,
        weekForecast: forecastData,
        location: data.resolvedAddress,
        wind120m,
        gust120m,
        wind160m,
        gust160m
      };

      setWindData(formattedData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Could not fetch weather data. Please try again.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setForceLoading(false);
      }, 1000);
    }
  };

  if (loading || forceLoading) return <LoadingSpinner />;

  return (
    <div className="wind-forecast">
      <div className="glass-container">
        <h1 className="main-title">Wind Turbine Pro</h1>
        
        <div className="search-container">
          <input
            ref={searchInputRef}
            type="text"
            id="location-search"
            name="location-search"
            className="search-input"
            placeholder="Search location..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            aria-label="Search location"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          {suggestions.length > 0 && (
            <div className="suggestions" role="listbox">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.name}-${suggestion.country}`}
                  className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  {suggestion.name}, {suggestion.country}
                </div>
              ))}
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>

        {windData && (
          <>
            <h2>{lastSearchedLocation}</h2>
            <p className="current-time">{windData.timestamp}</p>

            <h3 className="section-title">Current Wind Speed</h3>
            <div className="wind-data">
              <div className="data-card">
                <div className="wind-speeds-grid">
                  <div className="wind-speed-item">
                    <span className="label">Ground</span>
                    <span className={`value ${getWindClass(windData.currentSpeed)}`}>
                      {windData.currentSpeed.toFixed(1)}
                    </span>
                    <span className="unit">m/s</span>
                  </div>
                  <div className="wind-speed-item">
                    <span className="label">Ground Gusts</span>
                    <span className={`value ${getWindClass(windData.gustSpeed)}`}>
                      {windData.gustSpeed.toFixed(1)}
                    </span>
                    <span className="unit">m/s</span>
                  </div>
                  <div className="wind-speed-item">
                    <span className="label">120m Gusts</span>
                    <span className={`value ${getWindClass(windData.gust120m)}`}>
                      {windData.gust120m.toFixed(1)}
                    </span>
                    <span className="unit">m/s</span>
                  </div>
                  <div className="wind-speed-item">
                    <span className="label">160m Gusts</span>
                    <span className={`value ${getWindClass(windData.gust160m)}`}>
                      {windData.gust160m.toFixed(1)}
                    </span>
                    <span className="unit">m/s</span>
                  </div>
                </div>
              </div>
              <div className="data-card">
                <span className="label">Wind Direction</span>
                <span className="value direction">
                  {windData.direction}° ({getWindDirection(windData.direction)})
                </span>
              </div>
            </div>

            <h3>7-Day Forecast + Today</h3>
            <div className="forecast-grid">
              {windData.weekForecast.map((day) => (
                <div key={day.day} className={`forecast-card ${day.isToday ? 'today' : ''}`}>
                  <span className="day">{day.isToday ? 'Today' : day.day}</span>
                  <div className="forecast-data">
                    <span className="weather-icon" title={day.conditions}>{day.icon}</span>
                    <span className="temp">{day.temperature.toFixed(1)}°C</span>
                    <div className={`wind ${getWindClass(day.windSpeed)}`}>
                      <span>Ground: {day.windSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div className={`wind ${getWindClass(day.windGust)}`}>
                      <span>Ground Gusts: {day.windGust.toFixed(1)} m/s</span>
                    </div>
                    <div className={`wind ${getWindClass(day.gust120m)}`}>
                      <span>120m Gusts: {day.gust120m.toFixed(1)} m/s</span>
                    </div>
                    <div className={`wind ${getWindClass(day.gust160m)}`}>
                      <span>160m Gusts: {day.gust160m.toFixed(1)} m/s</span>
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