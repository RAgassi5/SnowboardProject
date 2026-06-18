import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Webpack/CRA doesn't resolve Leaflet's default marker icon URLs correctly —
// re-point them at the bundled image imports.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RESORT_ZOOM = 11;

/**
 * ResortLocationMap — small read-only OpenStreetMap card showing a single
 * pin at the resort's coordinates. Informational only: no search, routing,
 * or extra controls. Falls back to a plain message when coordinates are
 * missing.
 */
function ResortLocationMap({ resort }) {
  const hasCoordinates = resort?.latitude != null && resort?.longitude != null;

  return (
    <div className="card">
      <h3 style={styles.cardTitle}>📍 Location</h3>

      {hasCoordinates ? (
        <div style={styles.mapWrap}>
          <MapContainer
            center={[resort.latitude, resort.longitude]}
            zoom={RESORT_ZOOM}
            scrollWheelZoom={false}
            style={styles.map}
            attributionControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[resort.latitude, resort.longitude]}>
              <Popup>{resort.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        <div className="empty-state" style={styles.unavailable}>
          <h3>📍 Location map unavailable</h3>
          <p>Coordinates are not available for this resort.</p>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  mapWrap: {
    height: 220,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  unavailable: {
    padding: 'var(--space-lg) 0',
  },
};

export default ResortLocationMap;
