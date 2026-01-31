import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { MapPin, AlertCircle } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const MapComponent = ({ orders = [], drivers = [], center, zoom = 14, optimizedRoute = [] }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isDemoMode = !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isDemoMode ? '' : apiKey,
    libraries: ['marker', 'geometry', 'drawing']
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Calculate route if optimizedRoute is provided
  useEffect(() => {
    if (isLoaded && optimizedRoute.length > 0) {
      const directionsService = new window.google.maps.DirectionsService();
      
      const waypoints = optimizedRoute.slice(0, -1).map(point => ({
        location: { lat: point.lat, lng: point.lng },
        stopover: true
      }));

      const destination = optimizedRoute[optimizedRoute.length - 1];

      directionsService.route(
        {
          origin: center,
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.error(`error fetching directions ${status}`);
          }
        }
      );
    } else {
      setDirectionsResponse(null);
    }
  }, [isLoaded, optimizedRoute, center]);

  // Show a placeholder if API key is not set
  if (isDemoMode) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="text-blue-600" size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Modo Demo de Mapas</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
          Para ver mapas reales, por favor ingresa tu <b>Google Maps API Key</b> en el archivo <code>.env</code>.
        </p>
        <div className="mt-4 p-3 bg-white rounded-xl text-[10px] font-mono text-left w-full overflow-hidden border border-slate-200">
          VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h3 className="text-lg font-bold text-red-900">Error al Cargar Mapas</h3>
        <p className="text-sm text-red-700 mt-2">La API Key de Google Maps parece ser inválida o no tiene los permisos necesarios.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          {
            "featureType": "all",
            "elementType": "geometry.fill",
            "stylers": [{ "weight": "2.00" }]
          },
          {
            "featureType": "all",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#9c9c9c" }]
          },
          {
            "featureType": "all",
            "elementType": "labels.text",
            "stylers": [{ "visibility": "on" }]
          },
          {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{ "color": "#f2f2f2" }]
          },
          {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
          },
          {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#c8d7d4" }]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#070707" }]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#ffffff" }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {/* Restaurant Marker */}
      <Marker
        position={center}
        icon={{
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }}
        title="Restaurante"
      />

      {/* Driver Markers */}
      {drivers.map(driver => (
        <Marker
          key={driver.id}
          position={{ lat: driver.lat, lng: driver.lng }}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/motorcycle.png",
            scaledSize: new window.google.maps.Size(40, 40)
          }}
          onClick={() => setSelectedPoint(driver)}
        />
      ))}

      {/* Order Markers (Only if not showing route) */}
      {!directionsResponse && orders.map(order => (
        <Marker
          key={order.id}
          position={{ lat: order.lat, lng: order.lng }}
          onClick={() => setSelectedPoint(order)}
        />
      ))}

      {/* Route Renderer */}
      {directionsResponse && (
        <DirectionsRenderer
          directions={directionsResponse}
          options={{
            polylineOptions: {
              strokeColor: '#2563eb',
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          }}
        />
      )}

      {selectedPoint && (
        <InfoWindow
          position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
          onCloseClick={() => setSelectedPoint(null)}
        >
          <div className="p-2 min-w-[150px]">
             <h4 className="font-bold text-slate-800">{selectedPoint.name || 'Pedido'}</h4>
             <p className="text-xs text-slate-500 mt-1">{selectedPoint.address || 'Ubicación actual'}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default React.memo(MapComponent);
