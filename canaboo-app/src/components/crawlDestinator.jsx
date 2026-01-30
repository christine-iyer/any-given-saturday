import React, { useState, useEffect } from 'react';

import customersToImport from '../data/data.jsx';

const DeliveryDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [route, setRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [coordsCache, setCoordsCache] = useState({});

  const MAX_ROUTE_DESTINATIONS = 14;
  const START_ADDRESS = {
    name: 'Start: 34 Atlantic St',
    ShipAddr: {
      Line1: '34 Atlantic St',
      City: 'Portland',
      CountrySubDivisionCode: 'ME',
      PostalCode: '04101'
    }
  };

  useEffect(() => {
    // Load Maine destinations from our data
    setDestinations(customersToImport);
  }, []);

  const destinationKey = (destination) => (
    `${destination.ShipAddr.Line1}|${destination.ShipAddr.City}|${destination.ShipAddr.PostalCode}`
  );

  const toggleRouteDestination = (destination) => {
    setRouteError('');
    setRoute([]);

    setSelectedDestinations((prev) => {
      const exists = prev.some((item) => destinationKey(item) === destinationKey(destination));
      if (exists) {
        return prev.filter((item) => destinationKey(item) !== destinationKey(destination));
      }

      if (prev.length >= MAX_ROUTE_DESTINATIONS) {
        setRouteError(`You can select up to ${MAX_ROUTE_DESTINATIONS} destinations.`);
        return prev;
      }

      return [...prev, destination];
    });
  };

  const geocodeDestination = async (destination) => {
    const key = destinationKey(destination);
    if (coordsCache[key]) {
      return coordsCache[key];
    }

    const query = `${destination.ShipAddr.Line1}, ${destination.ShipAddr.City}, ${destination.ShipAddr.CountrySubDivisionCode} ${destination.ShipAddr.PostalCode}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(`Unable to geocode: ${destination.name}`);
    }

    const coords = {
      lat: Number(results[0].lat),
      lng: Number(results[0].lon)
    };

    setCoordsCache((prev) => ({
      ...prev,
      [key]: coords
    }));

    return coords;
  };

  const toRadians = (value) => (value * Math.PI) / 180;

  const haversineDistance = (from, to) => {
    const earthRadius = 3958.8;
    const latDiff = toRadians(to.lat - from.lat);
    const lonDiff = toRadians(to.lng - from.lng);
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);

    const a = Math.sin(latDiff / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const buildOptimizedRoute = async () => {
    if (selectedDestinations.length < 2) {
      setRouteError('Select at least 2 destinations to optimize a route.');
      return;
    }

    setRouteError('');
    setRouteLoading(true);
    setRoute([]);

    try {
      const startCoords = await geocodeDestination(START_ADDRESS);
      const destinationsWithCoords = [];
      for (const destination of selectedDestinations) {
        const coords = await geocodeDestination(destination);
        destinationsWithCoords.push({ destination, coords });
      }

      const remaining = [...destinationsWithCoords];
      const ordered = [];
      let currentCoords = startCoords;

      while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        remaining.forEach((candidate, index) => {
          const distance = haversineDistance(currentCoords, candidate.coords);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        const nextStop = remaining.splice(nearestIndex, 1)[0];
        ordered.push({
          ...nextStop,
          distanceFromPrev: nearestDistance
        });
        currentCoords = nextStop.coords;
      }

      setRoute(ordered);
    } catch (error) {
      console.error('Error optimizing route:', error);
      setRouteError(error.message || 'Failed to build route.');
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRouteSelection = () => {
    setSelectedDestinations([]);
    setRoute([]);
    setRouteError('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Local Route Planner</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
        <h3>📍 Available Destinations ({destinations.length})</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Select up to {MAX_ROUTE_DESTINATIONS} stops and optimize a route
          starting from {START_ADDRESS.ShipAddr.Line1}, {START_ADDRESS.ShipAddr.City}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Destinations List */}
        <div>
          <h3>🎯 Delivery Destinations</h3>
          <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '13px', color: '#555' }}>
              Selected for route: {selectedDestinations.length} / {MAX_ROUTE_DESTINATIONS}
            </div>
            <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
              Start address: {START_ADDRESS.ShipAddr.Line1}, {START_ADDRESS.ShipAddr.City} {START_ADDRESS.ShipAddr.PostalCode}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={buildOptimizedRoute}
                disabled={routeLoading || selectedDestinations.length < 2}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: routeLoading || selectedDestinations.length < 2 ? 'not-allowed' : 'pointer'
                }}
              >
                {routeLoading ? 'Optimizing...' : 'Optimize Route'}
              </button>
              <button
                onClick={clearRouteSelection}
                disabled={routeLoading || selectedDestinations.length === 0}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: routeLoading || selectedDestinations.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Clear
              </button>
            </div>
            {routeError && (
              <div style={{ marginTop: '8px', color: '#d32f2f', fontSize: '12px' }}>{routeError}</div>
            )}
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            {destinations.map((dest, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedDestination === dest ? '#e3f2fd' : 'white'
                }}
                onClick={() => setSelectedDestination(dest)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedDestinations.some((item) => destinationKey(item) === destinationKey(dest))}
                    onChange={() => toggleRouteDestination(dest)}
                    onClick={(event) => event.stopPropagation()}
                    style={{ marginTop: '4px' }}
                  />
                  <div>
                <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{dest.name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {dest.ShipAddr.Line1}, {dest.ShipAddr.City}, {dest.ShipAddr.CountrySubDivisionCode} {dest.ShipAddr.PostalCode}
                </div>
                {dest.phone && (
                  <div style={{ fontSize: '12px', color: '#888' }}>📞 {dest.phone}</div>
                )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Destination Details */}
        <div>
          <h3>📌 Selected Destination</h3>
          {selectedDestination ? (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{selectedDestination.name}</div>
              <div style={{ fontSize: '13px', color: '#555' }}>
                {selectedDestination.ShipAddr.Line1}, {selectedDestination.ShipAddr.City}, {selectedDestination.ShipAddr.CountrySubDivisionCode} {selectedDestination.ShipAddr.PostalCode}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#666',
              border: '2px dashed #ddd',
              borderRadius: '8px'
            }}>
              ← Select a destination from the list
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
        <h4>🚚 How This Works:</h4>
        <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Select destinations from the list (up to {MAX_ROUTE_DESTINATIONS})</li>
          <li>Click “Optimize Route” to order stops using a nearest-neighbor heuristic</li>
          <li>Review the estimated distance between each stop</li>
        </ol>
      </div>
      {route.length > 0 && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f0fe', borderRadius: '8px' }}>
          <h4>🧭 Optimized Route (heuristic)</h4>
          <div style={{ fontSize: '13px', color: '#444', marginBottom: '8px' }}>
            <strong>Start:</strong> {START_ADDRESS.ShipAddr.Line1}, {START_ADDRESS.ShipAddr.City} {START_ADDRESS.ShipAddr.PostalCode}
          </div>
          <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
            {route.map((step, index) => (
              <li key={destinationKey(step.destination)} style={{ marginBottom: '6px' }}>
                <strong>{index + 1}. {step.destination.name}</strong> — {step.destination.ShipAddr.Line1}, {step.destination.ShipAddr.City}
                <div style={{ fontSize: '12px', color: '#555' }}>
                  {index === 0 ? 'From start' : 'From previous stop'}: {step.distanceFromPrev.toFixed(1)} miles
                </div>
              </li>
            ))}
          </ol>
          <div style={{ fontSize: '12px', color: '#555' }}>
            Route uses a nearest-neighbor heuristic based on geocoded addresses.
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDestinations;
