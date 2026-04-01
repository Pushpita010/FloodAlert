/* ===================================
   UI/UX Enhancements
   Dark Mode, Toasts, Search History, Favorites
   =================================== */

// Theme State
let uiState = {
    darkMode: localStorage.getItem('darkMode') === 'true',
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || []
};

/* ===================================
   DARK MODE TOGGLE
   =================================== */

function initializeDarkMode() {
    if (uiState.darkMode) {
        enableDarkMode();
    }
    
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('darkModeMenuBtn').addEventListener('click', () => {
        toggleDarkMode();
        closeProfileDropdown();
    });
}

function toggleDarkMode() {
    uiState.darkMode = !uiState.darkMode;
    localStorage.setItem('darkMode', uiState.darkMode);
    
    if (uiState.darkMode) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}

function enableDarkMode() {
    document.documentElement.style.setProperty('--bg-primary', '#1a1a1a');
    document.documentElement.style.setProperty('--bg-secondary', '#2d2d2d');
    document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
    document.documentElement.style.setProperty('--text-secondary', '#b0b0b0');
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').textContent = '☀️';
    document.getElementById('darkModeMenuBtn').textContent = '☀️ Light Mode';
    showToast('🌙 Dark mode enabled', 'info');
}

function disableDarkMode() {
    document.documentElement.style.setProperty('--bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
    document.documentElement.style.setProperty('--text-primary', '#333333');
    document.documentElement.style.setProperty('--text-secondary', '#666666');
    document.body.classList.remove('dark-mode');
    document.getElementById('darkModeBtn').textContent = '🌙';
    document.getElementById('darkModeMenuBtn').textContent = '🌙 Dark Mode';
    showToast('☀️ Light mode enabled', 'info');
}

/* ===================================
   TOAST NOTIFICATIONS
   =================================== */

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set emoji based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '•'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ===================================
   RESULTS POPUP MODAL
   =================================== */

function showResultsPopup(place, latitude, longitude, floodRegions, regionSummary, searchRadius = 100) {
    // Show stats card
    document.getElementById('statsCard').classList.remove('hidden');
    
    // Calculate overall risk percentage
    let overallRiskPercent = 0;
    if (floodRegions.length > 0) {
        const avgConfidence = floodRegions.reduce((sum, r) => sum + r.confidence, 0) / floodRegions.length;
        overallRiskPercent = Math.round(avgConfidence * 100);
    }
    
    // Get timestamp
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Build flood regions list
    let regionsHTML = '<div class="regions-list" style="max-height: 250px; overflow-y: auto; margin-top: 12px;">';
    if (floodRegions && floodRegions.length > 0) {
        floodRegions.forEach((region, index) => {
            const severityColor = {
                'high': '#dc2626',
                'medium': '#ea580c',
                'low': '#16a34a'
            }[region.severity] || '#666';
            
            regionsHTML += `
                <div style="background: #f5f5f5; padding: 8px; margin-bottom: 6px; border-radius: 6px; border-left: 4px solid ${severityColor}; font-size: 0.85rem;">
                    <div><strong>Region ${index + 1}</strong> • ${region.severity.toUpperCase()}</div>
                    <div style="margin-top: 2px; color: #666;">📍 ${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}</div>
                    <div style="margin-top: 2px;">Confidence: <span style="color: ${severityColor}; font-weight: bold;">${(region.confidence * 100).toFixed(0)}%</span> | Distance: ${region.distance_km.toFixed(1)}km</div>
                </div>
            `;
        });
    } else {
        regionsHTML += '<p style="padding: 10px; color: #16a34a; text-align: center; font-weight: 500;">✓ No flood regions detected - Area is safe!</p>';
    }
    regionsHTML += '</div>';
    
    // Update the stats card content
    const statsCard = document.getElementById('statsCard');
    statsCard.innerHTML = `
        <h3>📊 Risk Analysis</h3>
        
        <!-- Location Info -->
        <div style="background: #e8f5e9; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #4caf50; font-size: 0.85rem;">
            <p style="margin: 3px 0; font-weight: 600;">📍 ${place}</p>
            <p style="margin: 3px 0; color: #555;">📌 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</p>
        </div>
        
        <!-- Risk Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-size: 0.85rem;">
            <div style="background: #fce4ec; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #666;">Overall Risk</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: #d32f2f;">${overallRiskPercent}%</div>
            </div>
            <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #666;">Regions Found</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: #1976d2;">${floodRegions.length}</div>
            </div>
        </div>
        
        <!-- Summary Stats -->
        <div style="background: #fff3e0; padding: 8px; border-radius: 8px; margin-bottom: 10px; font-size: 0.85rem;">
            <div style="font-weight: 600; margin-bottom: 5px;">Risk Distribution:</div>
            <div style="display: flex; justify-content: space-around;">
                <span>🔴 High: <strong>${regionSummary.high_risk}</strong></span>
                <span>🟡 Med: <strong>${regionSummary.medium_risk}</strong></span>
                <span>🟢 Low: <strong>${regionSummary.low_risk}</strong></span>
            </div>
        </div>
        
        <!-- Additional Info -->
        <div style="background: #f3f3f3; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 0.8rem; color: #666;">
            <div style="margin-bottom: 3px;">🔍 Search Radius: ${searchRadius}km</div>
            <div>⏰ Analysis: ${timestamp}</div>
        </div>
        
        <!-- Detected Regions -->
        <div style="margin-bottom: 10px;">
            <h4 style="margin: 8px 0 6px 0; font-size: 0.9rem;">Detected Regions:</h4>
            ${regionsHTML}
        </div>
        
        <button id="addToFavBtn" class="btn-secondary" style="width: 100%; margin-top: 8px; font-size: 0.9rem; padding: 8px;">❤️ Add to Favorites</button>
    `;
}

/* ===================================
   SEARCH HISTORY
   =================================== */

function addToSearchHistory(searchTerm) {
    // Avoid duplicates - move to front if exists
    uiState.searchHistory = uiState.searchHistory.filter(item => item !== searchTerm);
    uiState.searchHistory.unshift(searchTerm);
    
    // Keep only last 10
    if (uiState.searchHistory.length > 10) {
        uiState.searchHistory.pop();
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(uiState.searchHistory));
    updateSearchHistoryUI();
}

function updateSearchHistoryUI() {
    const historyList = document.getElementById('searchHistoryList');
    const recentSearchesDiv = document.getElementById('recentSearches');
    
    if (uiState.searchHistory.length === 0) {
        recentSearchesDiv.classList.add('hidden');
        return;
    }
    
    recentSearchesDiv.classList.remove('hidden');
    historyList.innerHTML = '';
    
    uiState.searchHistory.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'history-item';
        btn.textContent = '🕐 ' + item;
        btn.addEventListener('click', () => {
            document.getElementById('searchInput').value = item;
            document.getElementById('detectBtn').click();
        });
        historyList.appendChild(btn);
    });
}

/* ===================================
   FAVORITES/BOOKMARKS
   =================================== */

function addToFavorites(location) {
    // location = { name, lat, lng, risk }
    const exists = uiState.favorites.some(fav => 
        fav.lat === location.lat && fav.lng === location.lng
    );
    
    if (exists) {
        showToast('❤️ Already in favorites!', 'warning');
        return;
    }
    
    uiState.favorites.push({
        ...location,
        savedAt: new Date().toLocaleString()
    });
    
    localStorage.setItem('favorites', JSON.stringify(uiState.favorites));
    updateFavoritesUI();
    showToast('❤️ Added to favorites!', 'success');
}

function removeFromFavorites(lat, lng) {
    uiState.favorites = uiState.favorites.filter(fav => 
        !(fav.lat === lat && fav.lng === lng)
    );
    localStorage.setItem('favorites', JSON.stringify(uiState.favorites));
    updateFavoritesUI();
    showToast('💔 Removed from favorites', 'info');
}

function updateFavoritesUI() {
    const favoritesList = document.getElementById('favoritesList');
    const favoritesDropdownList = document.getElementById('favoritesDropdownList');
    
    if (uiState.favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-state">No saved locations yet</p>';
        if (favoritesDropdownList) {
            favoritesDropdownList.innerHTML = '<p class="empty-state">No saved locations yet</p>';
        }
        return;
    }
    
    favoritesList.innerHTML = '';
    if (favoritesDropdownList) favoritesDropdownList.innerHTML = '';
    
    uiState.favorites.forEach(fav => {
        // Update sidebar favorites list
        const favItem = document.createElement('div');
        favItem.className = 'favorite-item';
        
        const riskColor = getRiskColor(fav.risk);
        
        favItem.innerHTML = `
            <div class="fav-info">
                <strong>${fav.name}</strong><br>
                <small>${fav.lat.toFixed(2)}, ${fav.lng.toFixed(2)}</small>
            </div>
            <div class="fav-risk" style="background-color: ${riskColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                ${fav.risk}
            </div>
            <button class="fav-btn-remove" data-lat="${fav.lat}" data-lng="${fav.lng}">✕</button>
        `;
        
        favItem.querySelector('.fav-btn-remove').addEventListener('click', (e) => {
            removeFromFavorites(parseFloat(e.target.dataset.lat), parseFloat(e.target.dataset.lng));
        });
        
        // Click to navigate
        favItem.querySelector('.fav-info').addEventListener('click', () => {
            document.getElementById('searchInput').value = fav.name;
            document.getElementById('detectBtn').click();
        });
        
        favoritesList.appendChild(favItem);
        
        // Also update dropdown favorites list
        if (favoritesDropdownList) {
            const favDropdownItem = document.createElement('div');
            favDropdownItem.className = 'favorites-item';
            
            favDropdownItem.innerHTML = `
                <div style="flex: 1; cursor: pointer;" class="fav-search">
                    <div style="font-weight: 500; color: var(--text-primary);">${fav.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${fav.lat.toFixed(4)}, ${fav.lng.toFixed(4)}</div>
                </div>
                <button class="fav-dropdown-remove" data-lat="${fav.lat}" data-lng="${fav.lng}" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 1.2rem; padding: 4px;">✕</button>
            `;
            
            favDropdownItem.querySelector('.fav-search').addEventListener('click', () => {
                document.getElementById('searchInput').value = fav.name;
                document.getElementById('detectBtn').click();
                document.getElementById('favoritesDropdown').classList.add('hidden');
            });
            
            favDropdownItem.querySelector('.fav-dropdown-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromFavorites(parseFloat(e.target.dataset.lat), parseFloat(e.target.dataset.lng));
            });
            
            favoritesDropdownList.appendChild(favDropdownItem);
        }
    });
}

/* ===================================
   RISK STATISTICS DASHBOARD
   =================================== */

function updateRiskStats(location, riskData) {
    const statsCard = document.getElementById('statsCard');
    
    // Calculate risk percentage (demo)
    const riskPercent = {
        'HIGH': 85,
        'MEDIUM': 55,
        'LOW': 25,
        'SAFE': 10
    }[riskData.risk] || 0;
    
    // Calculate demo flood height based on risk
    const floodHeight = {
        'HIGH': (5 + Math.random() * 3).toFixed(1),
        'MEDIUM': (2 + Math.random() * 2).toFixed(1),
        'LOW': (0 + Math.random() * 1).toFixed(1),
        'SAFE': 0
    }[riskData.risk] || 0;
    
    // Update stats
    document.getElementById('overallRisk').textContent = riskPercent + '%';
    document.getElementById('overallRisk').style.color = riskData.color;
    document.getElementById('floodHeight').textContent = floodHeight + ' m';
    document.getElementById('statsTime').textContent = new Date().toLocaleTimeString();
    
    // Store current location for favorites button
    window.currentLocationForFav = {
        name: location,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        risk: riskData.risk
    };
    
    statsCard.classList.remove('hidden');
}

function setupFavoritesButton() {
    document.getElementById('addToFavBtn').addEventListener('click', () => {
        if (window.currentLocationForFav) {
            addToFavorites(window.currentLocationForFav);
        }
    });
}

/* ===================================
   UTILITY FUNCTIONS
   =================================== */

function getRiskColor(risk) {
    const colors = {
        'HIGH': '#d32f2f',
        'MEDIUM': '#ff9800',
        'LOW': '#4caf50',
        'SAFE': '#4caf50'
    };
    return colors[risk] || '#666';
}

/* ===================================
   MODAL MANAGEMENT
   =================================== */

function initializeModals() {
    // Modal menu items
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    const helpLink = document.getElementById('helpLink');
    const aboutLink = document.getElementById('aboutLink');
    
    // Modals
    const profileModal = document.getElementById('profileModal');
    const settingsModal = document.getElementById('settingsModal');
    const helpModal = document.getElementById('helpModal');
    const aboutModal = document.getElementById('aboutModal');
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    
    // Open modals
    profileLink.addEventListener('click', () => {
        openModal(profileModal);
        updateProfileModal();
    });
    
    settingsLink.addEventListener('click', () => {
        openModal(settingsModal);
    });
    
    helpLink.addEventListener('click', () => {
        openModal(helpModal);
    });
    
    aboutLink.addEventListener('click', () => {
        openModal(aboutModal);
    });
    
    // Close modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal);
        });
    });
    
    // Close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
}

function openModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        // Close profile dropdown when opening modal
        closeProfileDropdown();
    }
}

function closeModal(modal) {
    if (modal) modal.classList.add('hidden');
}

function updateProfileModal() {
    const user = JSON.parse(localStorage.getItem('authState') || '{}');
    document.getElementById('modalProfileName').textContent = user.name || 'User';
    document.getElementById('modalProfileEmail').textContent = user.email || 'user@email.com';
    
    // Calculate member since date (demo)
    const joinDate = new Date(user.createdAt || Date.now() - 90 * 24 * 60 * 60 * 1000);
    document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
    });
    
    const searches = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    document.getElementById('totalSearches').textContent = searches.length;
}

/* ===================================
   EMERGENCY SOS BUTTON & DROPDOWN
   =================================== */

function initializeEmergencyButton() {
    const emergencyBtn = document.getElementById('emergencyBtn');
    const emergencyDropdown = document.getElementById('emergencyDropdown');
    const safetyBtn = document.getElementById('safetyBtn');
    const safetyDropdown = document.getElementById('safetyDropdown');
    const profileDropdown = document.getElementById('profileDropdown');
    const favoritesBtn = document.getElementById('favoritesBtn');
    const favoritesDropdown = document.getElementById('favoritesDropdown');
    
    // Toggle favorites dropdown on button click
    if (favoritesBtn && favoritesDropdown) {
        favoritesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = favoritesDropdown.classList.contains('hidden');
            
            // Close other dropdowns
            emergencyDropdown.classList.add('hidden');
            profileDropdown.classList.add('hidden');
            safetyDropdown.classList.add('hidden');
            
            // Toggle favorites dropdown
            if (isHidden) {
                favoritesDropdown.classList.remove('hidden');
            } else {
                favoritesDropdown.classList.add('hidden');
            }
        });
    }
    
    // Toggle safety dropdown on button click
    safetyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = safetyDropdown.classList.contains('hidden');
        
        // Close other dropdowns
        emergencyDropdown.classList.add('hidden');
        profileDropdown.classList.add('hidden');
        if (favoritesDropdown) favoritesDropdown.classList.add('hidden');
        
        // Toggle safety dropdown
        if (isHidden) {
            safetyDropdown.classList.remove('hidden');
        } else {
            safetyDropdown.classList.add('hidden');
        }
    });
    
    // Toggle emergency dropdown on button click
    emergencyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = emergencyDropdown.classList.contains('hidden');
        
        // Close profile dropdown
        profileDropdown.classList.add('hidden');
        safetyDropdown.classList.add('hidden');
        if (favoritesDropdown) favoritesDropdown.classList.add('hidden');
        
        // Toggle emergency dropdown
        if (isHidden) {
            emergencyDropdown.classList.remove('hidden');
        } else {
            emergencyDropdown.classList.add('hidden');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!emergencyBtn.contains(e.target) && !emergencyDropdown.contains(e.target)) {
            emergencyDropdown.classList.add('hidden');
        }
        if (!safetyBtn.contains(e.target) && !safetyDropdown.contains(e.target)) {
            safetyDropdown.classList.add('hidden');
        }
        if (favoritesBtn && !favoritesBtn.contains(e.target) && !favoritesDropdown.contains(e.target)) {
            favoritesDropdown.classList.add('hidden');
        }
    });
    
    // Close dropdown when item is clicked (for tel: links)
    document.querySelectorAll('.emergency-item').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(() => {
                emergencyDropdown.classList.add('hidden');
            }, 500);
        });
    });
}

function closeProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) profileDropdown.classList.add('hidden');
}

/* ===================================
   INITIALIZE ALL UI FEATURES
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    initializeEmergencyButton();
    initializeModals();
    updateSearchHistoryUI();
    updateFavoritesUI();
    setupFavoritesButton();
    
    console.log('✓ UI features initialized (Dark Mode, Emergency SOS, Toasts, History, Favorites, Modals)');
});
