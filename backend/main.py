from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import requests
import json
from dateutil import parser
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Universe Simulator API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache
cache: Dict[str, Dict] = {}
CACHE_DURATION = timedelta(hours=1)

# Planet data mapping for JPL Horizons API
PLANET_IDS = {
    "sun": "10",
    "mercury": "199",
    "venus": "299", 
    "earth": "399",
    "mars": "499",
    "jupiter": "599",
    "saturn": "699",
    "uranus": "799",
    "neptune": "899"
}

PLANET_INFO = {
    "sun": {"name": "Sun", "radius": 696340, "type": "star"},
    "mercury": {"name": "Mercury", "radius": 2439.7, "type": "planet"},
    "venus": {"name": "Venus", "radius": 6051.8, "type": "planet"},
    "earth": {"name": "Earth", "radius": 6371.0, "type": "planet"},
    "mars": {"name": "Mars", "radius": 3389.5, "type": "planet"},
    "jupiter": {"name": "Jupiter", "radius": 69911, "type": "planet"},
    "saturn": {"name": "Saturn", "radius": 58232, "type": "planet"},
    "uranus": {"name": "Uranus", "radius": 25362, "type": "planet"},
    "neptune": {"name": "Neptune", "radius": 24622, "type": "planet"}
}

def get_cache_key(time_str: str) -> str:
    """Generate cache key for given time"""
    return f"positions_{time_str}"

def is_cache_valid(cache_entry: Dict) -> bool:
    """Check if cache entry is still valid"""
    if "timestamp" not in cache_entry:
        return False
    
    cache_time = datetime.fromisoformat(cache_entry["timestamp"])
    return datetime.now() - cache_time < CACHE_DURATION

async def fetch_jpl_horizons_data(body_id: str, start_time: str, stop_time: str) -> Dict:
    """Fetch data from JPL Horizons API"""
    base_url = "https://ssd-api.jpl.nasa.gov/horizons.api"
    
    params = {
        'format': 'json',
        'COMMAND': body_id,
        'OBJ_DATA': 'NO',
        'MAKE_EPHEM': 'YES',
        'EPHEM_TYPE': 'VECTORS',
        'CENTER': '500@10',  # Solar System Barycenter
        'START_TIME': start_time,
        'STOP_TIME': stop_time,
        'STEP_SIZE': '1d',
        'VEC_TABLE': '2',  # Position vectors only
        'REF_PLANE': 'ECLIPTIC',
        'REF_SYSTEM': 'J2000',
        'VEC_CORR': 'NONE',
        'OUT_UNITS': 'AU-D',
        'CSV_FORMAT': 'YES'
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error fetching JPL data for body {body_id}: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to fetch data from JPL Horizons API: {str(e)}")

def parse_jpl_response(jpl_data: Dict, body_name: str) -> Dict:
    """Parse JPL Horizons response to extract position data"""
    try:
        if 'result' not in jpl_data:
            raise ValueError("No result in JPL response")
        
        result_text = jpl_data['result']
        
        # Find the data section
        lines = result_text.split('\n')
        data_started = False
        position_data = None
        
        for line in lines:
            if '$$SOE' in line:  # Start of ephemeris
                data_started = True
                continue
            elif '$$EOE' in line:  # End of ephemeris
                break
            elif data_started and line.strip():
                # Parse the position data line
                parts = line.split(',')
                if len(parts) >= 4:
                    try:
                        x = float(parts[2].strip())
                        y = float(parts[3].strip()) 
                        z = float(parts[4].strip())
                        position_data = {"x": x, "y": y, "z": z}
                        break
                    except (ValueError, IndexError):
                        continue
        
        if position_data is None:
            # Fallback to approximate positions if JPL fails
            logger.warning(f"Could not parse JPL data for {body_name}, using fallback")
            return get_fallback_position(body_name)
        
        return position_data
        
    except Exception as e:
        logger.error(f"Error parsing JPL response for {body_name}: {e}")
        return get_fallback_position(body_name)

def get_fallback_position(body_name: str) -> Dict:
    """Provide fallback positions for planets"""
    fallback_positions = {
        "sun": {"x": 0, "y": 0, "z": 0},
        "mercury": {"x": 0.39, "y": 0, "z": 0},
        "venus": {"x": 0.72, "y": 0, "z": 0},
        "earth": {"x": 1.0, "y": 0, "z": 0},
        "mars": {"x": 1.52, "y": 0, "z": 0},
        "jupiter": {"x": 5.20, "y": 0, "z": 0},
        "saturn": {"x": 9.54, "y": 0, "z": 0},
        "uranus": {"x": 19.22, "y": 0, "z": 0},
        "neptune": {"x": 30.06, "y": 0, "z": 0}
    }
    return fallback_positions.get(body_name, {"x": 0, "y": 0, "z": 0})

@app.get("/")
async def root():
    return {"message": "Universe Simulator API", "version": "1.0.0"}

@app.get("/positions")
async def get_positions(time: Optional[str] = None):
    """Get positions of all planets at specified time"""
    if time is None:
        time_dt = datetime.now()
        time_str = time_dt.isoformat()
    else:
        try:
            time_dt = parser.parse(time)
            time_str = time_dt.isoformat()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid time format")
    
    # Check cache
    cache_key = get_cache_key(time_str)
    if cache_key in cache and is_cache_valid(cache[cache_key]):
        logger.info(f"Returning cached data for {time_str}")
        return cache[cache_key]["data"]
    
    positions = {}
    
    # Format time for JPL API
    jpl_time = time_dt.strftime("%Y-%m-%d")
    next_day = (time_dt + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Fetch positions for all planets
    for planet_name, planet_id in PLANET_IDS.items():
        try:
            jpl_data = await fetch_jpl_horizons_data(planet_id, jpl_time, next_day)
            position = parse_jpl_response(jpl_data, planet_name)
            
            positions[planet_name] = {
                "position": position,
                "info": PLANET_INFO[planet_name]
            }
        except Exception as e:
            logger.error(f"Error fetching position for {planet_name}: {e}")
            # Use fallback position
            positions[planet_name] = {
                "position": get_fallback_position(planet_name),
                "info": PLANET_INFO[planet_name]
            }
    
    result = {
        "time": time_str,
        "positions": positions
    }
    
    # Cache the result
    cache[cache_key] = {
        "data": result,
        "timestamp": datetime.now().isoformat()
    }
    
    return result

@app.get("/planet/{planet_name}")
async def get_planet_info(planet_name: str):
    """Get detailed information about a specific planet"""
    planet_name = planet_name.lower()
    
    if planet_name not in PLANET_INFO:
        raise HTTPException(status_code=404, detail="Planet not found")
    
    return PLANET_INFO[planet_name]

@app.get("/distance")
async def calculate_distance(body1: str, body2: str, time: Optional[str] = None):
    """Calculate distance between two celestial bodies"""
    body1 = body1.lower()
    body2 = body2.lower()
    
    if body1 not in PLANET_IDS or body2 not in PLANET_IDS:
        raise HTTPException(status_code=404, detail="One or both bodies not found")
    
    # Get positions
    positions_data = await get_positions(time)
    positions = positions_data["positions"]
    
    pos1 = positions[body1]["position"]
    pos2 = positions[body2]["position"]
    
    # Calculate Euclidean distance
    distance = ((pos2["x"] - pos1["x"])**2 + 
                (pos2["y"] - pos1["y"])**2 + 
                (pos2["z"] - pos1["z"])**2)**0.5
    
    return {
        "body1": body1,
        "body2": body2,
        "distance_au": distance,
        "distance_km": distance * 149597870.7,  # Convert AU to km
        "time": positions_data["time"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)