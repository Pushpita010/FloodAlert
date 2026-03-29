/* ===================================
   Flood Detection System - Main App
   =================================== */

// Global Variables
let map;
let currentLocation = { lat: 20.5937, lng: 78.9629 }; // Default: India center
let floodOverlay;

// Demo flood-prone areas (example polygons for different risk levels)
const demoFloodAreas = [
    {
        name: 'Critical Flood Zone - North',
        coords: [
            [28.7, 77.1],
            [28.75, 77.2],
            [28.7, 77.25],
            [28.65, 77.15]
        ],
        risk: 'high',
        color: '#d32f2f'
    },
    {
        name: 'Medium Risk Zone - Central',
        coords: [
            [20.0, 78.0],
            [20.1, 78.2],
            [19.9, 78.25],
            [19.85, 78.05]
        ],
        risk: 'medium',
        color: '#ff9800'
    },
    {
        name: 'Low Risk Zone - South',
        coords: [
            [12.9, 77.6],
            [13.0, 77.8],
            [12.8, 77.85],
            [12.75, 77.65]
        ],
        risk: 'low',
        color: '#4caf50'
    }
];

/* ===================================
   INITIALIZATION
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated before initializing map
    const savedAuth = localStorage.getItem('authState');
    if (savedAuth) {
        const auth = JSON.parse(savedAuth);
        if (auth.isAuthenticated) {
            initializeMap();
            addEventListeners();
            updateLastUpdate();
            console.log('✓ Flood Detection System initialized');
        }
    }
});

/* ===================================
   MAP INITIALIZATION
   =================================== */

function initializeMap() {
    // Initialize Leaflet Map
    map = L.map('map').setView(
        [currentLocation.lat, currentLocation.lng],
        5
    );

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    // Add Demo Flood Overlays
    addFloodOverlays();

    // Add Default Marker
    addMarker(currentLocation.lat, currentLocation.lng, 'Current Location');

    console.log('✓ Map initialized with coordinates:', currentLocation);
}

/* ===================================
   ADD FLOOD OVERLAY POLYGONS
   =================================== */

function addFloodOverlays() {
    demoFloodAreas.forEach(area => {
        const polygon = L.polygon(area.coords, {
            color: area.color,
            fillColor: area.color,
            fillOpacity: 0.4,
            weight: 2,
            dashArray: '5, 5'
        }).addTo(map);

        // Popup on click
        polygon.bindPopup(`
            <div style="padding: 10px;">
                <strong>${area.name}</strong><br>
                Risk Level: <strong>${area.risk.toUpperCase()}</strong>
            </div>
        `);

        console.log(`✓ Added flood zone: ${area.name}`);
    });
}

/* ===================================
   ADD MARKER TO MAP
   =================================== */

function addMarker(lat, lng, title = 'Location') {
    // Remove previous marker if exists
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add new marker
    const marker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    marker.bindPopup(title).openPopup();
    map.setView([lat, lng], map.getZoom());

    console.log(`✓ Marker added at ${lat}, ${lng}`);
}

/* ===================================
   ASSESS FLOOD RISK
   =================================== */

function assessFloodRisk(lat, lng) {
    // Check if location is within any flood zone
    for (let area of demoFloodAreas) {
        if (isPointInPolygon([lat, lng], area.coords)) {
            return {
                risk: area.risk.toUpperCase(),
                zone: area.name,
                color: area.color
            };
        }
    }
    return {
        risk: 'SAFE',
        zone: 'No flood zone detected',
        color: '#4caf50'
    };
}

/* ===================================
   POINT IN POLYGON ALGORITHM
   =================================== */

function isPointInPolygon(point, polygon) {
    const [lat, lng] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect =
            (yi > lng) !== (yj > lng) &&
            lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
}

/* ===================================
   UPDATE INFO CARD
   =================================== */

function updateInfoCard(lat, lng, locationName = 'Selected Location') {
    const riskData = assessFloodRisk(lat, lng);

    document.getElementById('infoLocation').textContent =
        locationName + ' (' + riskData.zone + ')';
    document.getElementById('infoLat').textContent = lat.toFixed(4);
    document.getElementById('infoLon').textContent = lng.toFixed(4);
    document.getElementById('infoRisk').textContent = riskData.risk;

    // Color code the risk status
    const riskElement = document.getElementById('infoRisk');
    riskElement.style.color = riskData.color;
    riskElement.style.fontWeight = 'bold';

    console.log('✓ Info card updated:', riskData);
}

/* ===================================
   SHOW/HIDE LOADER
   =================================== */

function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

/* ===================================
   EVENT LISTENERS
   =================================== */

function addEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const detectBtn = document.getElementById('detectBtn');
    const mapElement = document.getElementById('map');

    // Search Input - Real-time validation
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 0) {
            detectBtn.textContent = '🔍 Detect Flood Risk';
        } else {
            detectBtn.textContent = 'Detect Flood Risk';
        }
    });

    // Detect Button - Process search
    detectBtn.addEventListener('click', handleDetectClick);

    // Map Click - Update location and risk stats
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        currentLocation = { lat, lng };
        addMarker(lat, lng, 'Clicked Location');
        const riskData = assessFloodRisk(lat, lng);
        updateRiskStats('Map Click', riskData);
        addToSearchHistory(lat.toFixed(2) + ', ' + lng.toFixed(2));
        showToast('✓ Location updated', 'success');
        console.log('✓ Map clicked at:', { lat, lng });
    });

    console.log('✓ Event listeners attached');
}

/* ===================================
   HANDLE DETECT BUTTON CLICK
   =================================== */

function handleDetectClick() {
    showLoader();

    const searchInput = document.getElementById('searchInput').value.trim();

    // Simulate API call delay
    setTimeout(() => {
        if (searchInput.length > 0) {
            // Demo: Parse coordinates if provided (format: lat,lng)
            const coordMatch = searchInput.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);

            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);
                currentLocation = { lat, lng };
                addMarker(lat, lng, searchInput);
                const riskData = assessFloodRisk(lat, lng);
                updateRiskStats(searchInput, riskData);
                addToSearchHistory(searchInput);
                showToast('✓ Location detected: ' + searchInput, 'success');
            } else {
                // Example cities mapping (demo purposes)
                const cityLocations = {
                    'delhi': { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
                    'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
                    'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
                    'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
                    'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
                    'india': { lat: 20.5937, lng: 78.9629, name: 'India' }
                };

                const cityKey = searchInput.toLowerCase();
                if (cityLocations[cityKey]) {
                    const city = cityLocations[cityKey];
                    currentLocation = { lat: city.lat, lng: city.lng };
                    addMarker(city.lat, city.lng, city.name);
                    const riskData = assessFloodRisk(city.lat, city.lng);
                    updateRiskStats(city.name, riskData);
                    addToSearchHistory(city.name);
                    showToast('✓ ' + city.name + ' detected!', 'success');
                } else {
                    showToast('✕ Location not found. Try: Delhi, Mumbai, Bangalore', 'error');
                    hideLoader();
                    return;
                }
            }
        } else {
            // Detect current (default) location
            const riskData = assessFloodRisk(currentLocation.lat, currentLocation.lng);
            updateRiskStats('India Center', riskData);
            showToast('✓ Analyzing current location...', 'info');
        }

        hideLoader();
        updateLastUpdate();

        console.log('✓ Flood detection completed');
    }, 1500); // Simulate processing time
}

/* ===================================
   UTILITY FUNCTIONS
   =================================== */

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent =
        'Last Updated: ' + timeString;
}

// Log app info
console.log('%c🌊 Flood Detection System v1.0', 'font-size: 14px; color: #1976d2; font-weight: bold;');
console.log('%cDefault Location: India Center (20.5937°N, 78.9629°E)', 'font-size: 12px; color: #666;');
console.log('%cTry searching for: Delhi, Mumbai, Bangalore, Kolkata, Chennai', 'font-size: 12px; color: #666;');
console.log('%cOr enter coordinates: 28.7041,77.1025', 'font-size: 12px; color: #666;');
