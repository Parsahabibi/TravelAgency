import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fixes the issue with the default Leaflet marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = () => {

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [ticketPrice, setTicketPrice] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // 'origin' or 'destination'

  // Define Iran's latitude and longitude boundaries (bounding box)
  const iranBounds = {
    north: 39.7778, // northernmost point
    south: 25.0643, // southernmost point
    west: 44.0479,  // westernmost point
    east: 63.3336,  // easternmost point
  };

  const isWithinIran = (lat, lng) => {
    return lat >= iranBounds.south && lat <= iranBounds.north &&
           lng >= iranBounds.west && lng <= iranBounds.east;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        if (!isWithinIran(lat, lng)) {
          setError('Selected location must be within Iran.');
          return;
        }

        setError(null); // Clear any previous error

        if (editing === 'origin') {
          setOrigin({ lat, lng });
          setEditing(null); // Stop editing
        } else if (editing === 'destination') {
          setDestination({ lat, lng });
          setEditing(null); // Stop editing
        } else if (!origin) {
          setOrigin({ lat, lng });
        } else if (!destination) {
          setDestination({ lat, lng });
        }
      },
    });

    return (
      <>
        {origin && (
          <Marker
            position={[origin.lat, origin.lng]}
            eventHandlers={{
              click: () => setEditing('origin'), // Activate editing for origin
            }}
          >
            <Tooltip permanent direction="top">
              Origin
            </Tooltip>
          </Marker>
        )}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            eventHandlers={{
              click: () => setEditing('destination'), // Activate editing for destination
            }}
          >
            <Tooltip permanent direction="top">
              Destination
            </Tooltip>
          </Marker>
        )}
      </>
    );
  };

  const calculateDistance = async () => {
    if (origin && destination) {
      const API_KEY = 'RJUTV8JCWiMMFJvGY2J0bmS3cZ6dhqnzVa8O3skcJXPZr4xCdxaByxlOZqfmWfXG'; // Your DistanceMatrix.ai API key
      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;

      try {
        const response = await axios.get(
          `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&key=${API_KEY}`
        );

        if (response.data && response.data.rows[0] && response.data.rows[0].elements[0]) {
          const distanceText = response.data.rows[0].elements[0].distance.text;
          const distanceValue = parseFloat(distanceText); // Extract the distance in km

          // Check if the distance is less than 10 km
          if (distanceValue < 100) {
            setError('Price cannot be determined for distances less than 100 km.');
            setDistance(null);
            setTicketPrice(null);
            return;
          }

          setDistance(distanceText);
          setError(null); // Clear any previous errors

          // Calculate ticket price: $2 for every 10 km
          const price = Math.ceil(distanceValue / 10) * 2; // Rounding up for every 10km
          setTicketPrice(price);
        }
      } catch (error) {
        console.error('Error fetching distance:', error);
        setError('Error fetching distance data. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Map Section */}
      <MapContainer
        center={[35.6892, 51.3890]} // Center on Iran
        zoom={8}
        className="h-96 rounded-lg shadow-lg mt-[100px] w-[90%] mb-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>

      {/* Controls Section */}
      <div className="flex space-x-4">
        <button
          onClick={calculateDistance}
          className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition"
          disabled={!origin || !destination}
        >
          Calculate Distance
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-600 font-semibold">{error}</p>}

      {/* Display Origin, Destination, and Distance */}
      <div className="w-full flex flex-col items-center space-y-2">
        {origin && (
          <p className="text-sm text-gray-700">
            Origin: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
          </p>
        )}
        {destination && (
          <p className="text-sm text-gray-700">
            Destination: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
          </p>
        )}
        {distance && (
          <p className="text-lg text-green-600 font-semibold">
            Distance: {distance}
          </p>
        )}
        {ticketPrice !== null && (
          <p className="text-lg text-blue-600 font-semibold">
            Ticket Price: ${ticketPrice}
          </p>
        )}
      </div>
    </div>
  );
};

export default Map;
