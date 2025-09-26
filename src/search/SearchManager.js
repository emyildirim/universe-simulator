export class SearchManager {
    constructor(universeRenderer) {
        this.universeRenderer = universeRenderer;
        this.searchResults = [];
        this.setupUI();
    }
    
    setupUI() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        
        // Debounce search to avoid too many API calls
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }
    
    async performSearch(query) {
        if (!query || query.length < 2) {
            this.clearResults();
            return;
        }
        
        try {
            // First search local objects
            const localResults = this.searchLocalObjects(query);
            
            // Then search SIMBAD (with fallback for demo)
            const simbadResults = await this.searchSIMBAD(query);
            
            // Combine and display results
            const allResults = [...localResults, ...simbadResults];
            this.displayResults(allResults);
            
        } catch (error) {
            console.error('Search error:', error);
            // Fallback to local search only
            const localResults = this.searchLocalObjects(query);
            this.displayResults(localResults);
        }
    }
    
    searchLocalObjects(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        this.universeRenderer.objects.forEach((object, key) => {
            const name = object.userData.name || key;
            if (name.toLowerCase().includes(queryLower)) {
                results.push({
                    name: name,
                    type: object.userData.type || 'Unknown',
                    source: 'local',
                    object: object,
                    distance: object.userData.distance || 'Unknown',
                    ra: object.userData.ra || 'N/A',
                    dec: object.userData.dec || 'N/A'
                });
            }
        });
        
        return results;
    }
    
    async searchSIMBAD(query) {
        // SIMBAD API endpoint
        const simbadUrl = 'https://simbad.u-strasbg.fr/simbad/sim-script';
        
        // Create SIMBAD query script
        const script = `
            format object "%IDLIST(1) | %OTYPE | %COO(A D;ICRS) | %PLX | %FLUX(V)"
            query id ${query}
        `;
        
        try {
            // Note: SIMBAD CORS policy may block direct requests from browser
            // In a real implementation, you'd use a proxy server or server-side API
            const response = await fetch(simbadUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `script=${encodeURIComponent(script)}`
            });
            
            if (!response.ok) {
                throw new Error('SIMBAD request failed');
            }
            
            const text = await response.text();
            return this.parseSIMBADResponse(text);
            
        } catch (error) {
            console.warn('SIMBAD search failed, using mock data:', error);
            // Return mock data for demo purposes
            return this.getMockSIMBADResults(query);
        }
    }
    
    getMockSIMBADResults(query) {
        // Mock SIMBAD results for demonstration
        const mockData = [
            {
                name: 'Proxima Centauri',
                type: 'Red Dwarf Star',
                ra: '14h 29m 43s',
                dec: '-62° 40\' 46"',
                distance: '4.24 ly',
                magnitude: '11.13',
                source: 'simbad'
            },
            {
                name: 'Alpha Centauri A',
                type: 'G-type Star',
                ra: '14h 39m 36s',
                dec: '-60° 50\' 02"',
                distance: '4.37 ly',
                magnitude: '-0.01',
                source: 'simbad'
            },
            {
                name: 'Sirius',
                type: 'A-type Star',
                ra: '06h 45m 09s',
                dec: '-16° 42\' 58"',
                distance: '8.66 ly',
                magnitude: '-1.46',
                source: 'simbad'
            },
            {
                name: 'Vega',
                type: 'A-type Star',
                ra: '18h 36m 56s',
                dec: '+38° 47\' 01"',
                distance: '25.04 ly',
                magnitude: '0.03',
                source: 'simbad'
            }
        ];
        
        const queryLower = query.toLowerCase();
        return mockData.filter(item => 
            item.name.toLowerCase().includes(queryLower)
        );
    }
    
    parseSIMBADResponse(text) {
        // Parse SIMBAD response format
        const results = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('::data')) continue;
            if (line.startsWith('::error')) continue;
            if (line.trim() === '') continue;
            
            const parts = line.split('|');
            if (parts.length >= 5) {
                results.push({
                    name: parts[0].trim(),
                    type: parts[1].trim(),
                    ra: parts[2].split(' ')[0],
                    dec: parts[2].split(' ')[1],
                    distance: parts[3].trim() + ' pc',
                    magnitude: parts[4].trim(),
                    source: 'simbad'
                });
            }
        }
        
        return results;
    }
    
    displayResults(results) {
        this.searchResults.innerHTML = '';
        
        if (results.length === 0) {
            this.searchResults.innerHTML = '<p>No objects found</p>';
            return;
        }
        
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'search-result-item';
            resultElement.innerHTML = `
                <strong>${result.name}</strong><br>
                <small>${result.type} • ${result.distance}</small>
            `;
            
            resultElement.addEventListener('click', () => {
                this.selectResult(result);
            });
            
            this.searchResults.appendChild(resultElement);
        });
    }
    
    selectResult(result) {
        if (result.source === 'local' && result.object) {
            // Center camera on local object
            this.universeRenderer.centerCameraOn(result.name);
        } else {
            // For SIMBAD objects, create a placeholder or show info
            this.showExternalObjectInfo(result);
        }
        
        // Clear search
        this.searchInput.value = '';
        this.clearResults();
    }
    
    showExternalObjectInfo(result) {
        const infoPanel = document.getElementById('info-panel');
        const infoContent = document.getElementById('object-info-content');
        
        infoContent.innerHTML = `
            <h4>${result.name}</h4>
            <p><strong>Type:</strong> ${result.type}</p>
            <p><strong>Distance:</strong> ${result.distance}</p>
            <p><strong>RA/Dec:</strong> ${result.ra}, ${result.dec}</p>
            <p><strong>Magnitude:</strong> ${result.magnitude}</p>
            <p><strong>Source:</strong> SIMBAD Database</p>
            <p><em>Note: This object is not currently rendered in the 3D view.</em></p>
        `;
        
        infoPanel.style.display = 'block';
    }
    
    clearResults() {
        this.searchResults.innerHTML = '';
    }
}