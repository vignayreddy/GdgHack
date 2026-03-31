
/**
 * NyxWell NGO Impact Map Controller
 * Powered by Leaflet.js (Open Source)
 * Handles GIS visualization of mental health hotspots and mentor allocation.
 */

export const NGOMap = {
    map: null,
    markers: [],
    hotspots: [
        { id: 1, name: "South Mumbai", lat: 18.9229, lng: 72.8339, urgency: 'high', cases: 142, mentors: 5 },
        { id: 2, name: "North Delhi", lat: 28.7041, lng: 77.1025, urgency: 'high', cases: 189, mentors: 8 },
        { id: 3, name: "Bangalore Central", lat: 12.9716, lng: 77.5946, urgency: 'medium', cases: 94, mentors: 12 },
        { id: 4, name: "Hyderabad Tech Park", lat: 17.3850, lng: 78.4867, urgency: 'medium', cases: 76, mentors: 4 },
        { id: 5, name: "Pune Student Hub", lat: 18.5204, lng: 73.8567, urgency: 'high', cases: 112, mentors: 3 },
        { id: 6, name: "Kolkata East", lat: 22.5726, lng: 88.3639, urgency: 'low', cases: 45, mentors: 10 }
    ],
    isSatellite: false,

    init() {
        console.log("NyxWell: NGO Impact Map Initializing...");
        if (this.map) return; // Already initialized

        // 1. Initialize Map (Centered on India)
        this.map = L.map('ngo-map-canvas').setView([20.5937, 78.9629], 5);

        // 2. Add Default Tile Layer (OpenStreetMap)
        this.setTiles('street');

        // 3. Render Initial Hotspots
        this.renderHotspots();

        // 4. Attach UI Listeners
        this._attachListeners();

        // 5. Update Stats
        this.updateStats();

        // 6. Render Allocation List
        this.renderAllocationList();

        // 7. Force initial refresh
        this.refresh();

        // 6. Force initial refresh
        this.refresh();
    },

    refresh() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    },

    setTiles(type) {
        if (this.tileLayer) this.map.removeLayer(this.tileLayer);

        if (type === 'satellite') {
            this.tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });
        } else {
            // Dark Mode Maps (Zen Brutalism Aesthetic)
            this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}/{x}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            });
        }
        this.tileLayer.addTo(this.map);
    },

    renderHotspots() {
        // Clear existing markers
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];

        this.hotspots.forEach(spot => {
            const color = spot.urgency === 'high' ? '#e63946' : (spot.urgency === 'medium' ? '#F59E0B' : '#2a9d8f');
            
            // Create a custom pulsing marker effect using CircleMarker
            const marker = L.circleMarker([spot.lat, spot.lng], {
                radius: 12,
                fillColor: color,
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Bind Popup
            const popupContent = `
                <div class="brutal-card mono" style="padding: 10px; width: 200px; border: none; box-shadow: none;">
                    <div style="font-weight: 800; font-size: 14px; margin-bottom: 8px; color: ${color};">${spot.name.toUpperCase()}</div>
                    <div style="font-size: 11px; margin-bottom: 5px;">Active Cases: <b>${spot.cases}</b></div>
                    <div style="font-size: 11px; margin-bottom: 12px;">Mentors Assigned: <b>${spot.mentors}</b></div>
                    <button class="btn btn-primary" onclick="window.NGOMap.allocateMentor(${spot.id})" style="width: 100%; font-size: 10px; padding: 5px;">ALLOCATE MENTOR</button>
                </div>
            `;
            marker.bindPopup(popupContent);
            this.markers.push(marker);
        });
    },

    allocateMentor(spotId) {
        const spot = this.hotspots.find(s => s.id === spotId);
        if (spot) {
            spot.mentors++;
            spot.cases = Math.max(0, spot.cases - 2); // Simulate impact
            
            this.renderHotspots();
            this.renderAllocationList();
            this.updateStats();
            
            // Notification (if Extended module exists)
            if (window.NGOHubExtended) {
                window.NGOHubExtended.showToast(`RESOURCES DEPLOYED: Mentor dispatched to ${spot.name}`, 'success');
            }
        }
    },

    renderAllocationList() {
        const list = document.getElementById('map-allocation-list');
        if (!list) return;

        list.innerHTML = this.hotspots.map(spot => {
            const color = spot.urgency === 'high' ? '#e63946' : (spot.urgency === 'medium' ? '#F59E0B' : '#2a9d8f');
            const urgencyLabel = spot.urgency === 'high' ? 'CRITICAL' : (spot.urgency === 'medium' ? 'MODERATE' : 'STABLE');
            
            return `
                <div class="brutal-card" style="padding: 15px; background: var(--white); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 15px; border-left: 5px solid ${color};">
                    <div style="min-width: 180px;">
                        <div class="mono" style="font-weight: 800; font-size: 13px;">${spot.name.toUpperCase()}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px;">
                            <div class="mono" style="font-size: 10px; opacity: 0.6;">Cases: <b>${spot.cases}</b></div>
                            <div class="mono" style="font-size: 10px; opacity: 0.6;">Mentors: <b>${spot.mentors}</b></div>
                            <div class="mono" style="font-size: 10px; color: ${color}; font-weight: 800;">${urgencyLabel}</div>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="window.NGOMap.allocateMentor(${spot.id})" style="padding: 8px 15px; font-size: 10px; border-color: ${color}; white-space: nowrap;">DEPLOY TEAM →</button>
                </div>
            `;
        }).join('');
    },

    updateStats() {
        const totalCases = this.hotspots.reduce((sum, s) => sum + s.cases, 0);
        const totalMentors = this.hotspots.reduce((sum, s) => sum + s.mentors, 0);

        const casesEl = document.getElementById('map-active-cases');
        const mentorsEl = document.getElementById('map-active-mentors');
        const mobilizedEl = document.getElementById('map-mobilized-val');

        if (casesEl) casesEl.innerText = totalCases;
        if (mentorsEl) mentorsEl.innerText = totalMentors;
        if (mobilizedEl) mobilizedEl.innerText = totalMentors; // Sync mobilized count
    },

    _attachListeners() {
        const satBtn = document.getElementById('map-btn-satellite');
        if (satBtn) {
            satBtn.onclick = () => {
                this.isSatellite = !this.isSatellite;
                this.setTiles(this.isSatellite ? 'satellite' : 'street');
                satBtn.innerText = this.isSatellite ? 'VIEW STREET' : 'VIEW SATELLITE';
            };
        }
    }
};

// Global expose
window.NGOMap = NGOMap;
export default NGOMap;
