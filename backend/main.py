"""FastAPI application for the universe simulator backend."""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import json

from database import get_db, create_tables, CelestialObject, EphemerisData
from data_ingestion import DataIngestion
from coordinates import calculate_distance, is_within_bbox
from pydantic import BaseModel

# Pydantic models for API responses
class CelestialObjectResponse(BaseModel):
    id: int
    name: str
    object_type: str
    ra: Optional[float]
    dec: Optional[float]
    parallax: Optional[float]
    x: float
    y: float
    z: float
    magnitude: Optional[float]
    distance: Optional[float]
    spectral_type: Optional[str]
    source: str
    external_id: Optional[str]
    
    class Config:
        from_attributes = True

class PositionResponse(BaseModel):
    objects: List[CelestialObjectResponse]
    total_count: int

class DistanceResponse(BaseModel):
    object_a: CelestialObjectResponse
    object_b: CelestialObjectResponse
    distance_parsecs: float
    distance_light_years: float

class SearchResponse(BaseModel):
    results: List[CelestialObjectResponse]
    total_count: int

# Create FastAPI app
app = FastAPI(
    title="Universe Simulator API",
    description="Backend API for the universe simulator providing celestial object data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database and ingest initial data."""
    create_tables()
    
    # Check if we have data, if not, ingest initial dataset
    db = next(get_db())
    try:
        count = db.query(CelestialObject).count()
        if count == 0:
            print("No data found, ingesting initial dataset...")
            ingestion = DataIngestion()
            ingestion.set_session(db)
            results = ingestion.ingest_initial_dataset()
            print(f"Ingested: {results}")
    finally:
        db.close()

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Universe Simulator API", "version": "1.0.0"}

@app.get("/object/{object_id}", response_model=CelestialObjectResponse)
async def get_object(object_id: int, db: Session = Depends(get_db)):
    """Get a specific celestial object by ID."""
    obj = db.query(CelestialObject).filter(CelestialObject.id == object_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    return obj

@app.get("/search", response_model=SearchResponse)
async def search_objects(
    q: str = Query(..., description="Search query"),
    limit: int = Query(50, description="Maximum number of results"),
    offset: int = Query(0, description="Offset for pagination"),
    object_type: Optional[str] = Query(None, description="Filter by object type"),
    db: Session = Depends(get_db)
):
    """Search for celestial objects by name or other criteria."""
    query = db.query(CelestialObject)
    
    # Apply search filter
    if q:
        query = query.filter(CelestialObject.name.ilike(f"%{q}%"))
    
    # Apply object type filter
    if object_type:
        query = query.filter(CelestialObject.object_type == object_type)
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    objects = query.offset(offset).limit(limit).all()
    
    return SearchResponse(results=objects, total_count=total_count)

@app.get("/positions", response_model=PositionResponse)
async def get_positions(
    bbox: Optional[str] = Query(None, description="Bounding box as 'x_min,y_min,z_min,x_max,y_max,z_max'"),
    max_magnitude: Optional[float] = Query(None, description="Maximum magnitude for LOD filtering"),
    limit: int = Query(1000, description="Maximum number of objects to return"),
    offset: int = Query(0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """Get celestial object positions, optionally within a bounding box."""
    query = db.query(CelestialObject)
    
    # Apply magnitude filter for LOD
    if max_magnitude is not None:
        query = query.filter(CelestialObject.magnitude <= max_magnitude)
    
    # Apply bounding box filter
    if bbox:
        try:
            coords = [float(x) for x in bbox.split(',')]
            if len(coords) != 6:
                raise ValueError("Bounding box must have 6 coordinates")
            
            x_min, y_min, z_min, x_max, y_max, z_max = coords
            query = query.filter(
                CelestialObject.x >= x_min,
                CelestialObject.x <= x_max,
                CelestialObject.y >= y_min,
                CelestialObject.y <= y_max,
                CelestialObject.z >= z_min,
                CelestialObject.z <= z_max
            )
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid bounding box format")
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination
    objects = query.offset(offset).limit(limit).all()
    
    return PositionResponse(objects=objects, total_count=total_count)

@app.get("/distance", response_model=DistanceResponse)
async def calculate_object_distance(
    id_a: int = Query(..., description="ID of first object"),
    id_b: int = Query(..., description="ID of second object"),
    db: Session = Depends(get_db)
):
    """Calculate distance between two celestial objects."""
    # Get both objects
    obj_a = db.query(CelestialObject).filter(CelestialObject.id == id_a).first()
    obj_b = db.query(CelestialObject).filter(CelestialObject.id == id_b).first()
    
    if not obj_a:
        raise HTTPException(status_code=404, detail=f"Object with ID {id_a} not found")
    if not obj_b:
        raise HTTPException(status_code=404, detail=f"Object with ID {id_b} not found")
    
    # Calculate distance
    distance_pc = calculate_distance(obj_a.x, obj_a.y, obj_a.z, obj_b.x, obj_b.y, obj_b.z)
    distance_ly = distance_pc * 3.26156  # Convert parsecs to light-years
    
    return DistanceResponse(
        object_a=obj_a,
        object_b=obj_b,
        distance_parsecs=distance_pc,
        distance_light_years=distance_ly
    )

@app.get("/objects/types")
async def get_object_types(db: Session = Depends(get_db)):
    """Get all available object types."""
    types = db.query(CelestialObject.object_type).distinct().all()
    return {"types": [t[0] for t in types if t[0]]}

@app.get("/stats")
async def get_database_stats(db: Session = Depends(get_db)):
    """Get database statistics."""
    total_objects = db.query(CelestialObject).count()
    
    # Count by object type
    type_counts = {}
    types = db.query(CelestialObject.object_type).distinct().all()
    for obj_type in types:
        if obj_type[0]:
            count = db.query(CelestialObject).filter(CelestialObject.object_type == obj_type[0]).count()
            type_counts[obj_type[0]] = count
    
    return {
        "total_objects": total_objects,
        "object_type_counts": type_counts
    }

@app.post("/ingest/refresh")
async def refresh_data(db: Session = Depends(get_db)):
    """Refresh data by re-ingesting from sources."""
    ingestion = DataIngestion()
    ingestion.set_session(db)
    results = ingestion.ingest_initial_dataset()
    return {"message": "Data refresh completed", "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)