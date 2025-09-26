"""Database models and connection for the universe simulator."""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./universe_simulator.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class CelestialObject(Base):
    """Model for storing celestial objects with 3D coordinates."""
    __tablename__ = "celestial_objects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    object_type = Column(String, index=True)  # planet, star, galaxy, etc.
    
    # Equatorial coordinates
    ra = Column(Float)  # Right Ascension in degrees
    dec = Column(Float)  # Declination in degrees
    parallax = Column(Float)  # Parallax in milliarcseconds
    
    # 3D Cartesian coordinates (ICRS frame, in parsecs)
    x = Column(Float, index=True)
    y = Column(Float, index=True)
    z = Column(Float, index=True)
    
    # Physical properties
    magnitude = Column(Float, index=True)  # Visual magnitude for LOD
    distance = Column(Float)  # Distance in parsecs
    spectral_type = Column(String)
    
    # Data source and metadata
    source = Column(String)  # JPL, Gaia, ExoPlanet Archive, etc.
    external_id = Column(String)  # Original ID from data source
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Additional properties stored as JSON
    properties = Column(Text)  # JSON string for additional properties

class EphemerisData(Base):
    """Model for storing time-dependent position data."""
    __tablename__ = "ephemeris_data"
    
    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(Integer, index=True)  # Reference to CelestialObject
    
    # Time
    julian_date = Column(Float, index=True)
    
    # Position at this time (3D Cartesian)
    x = Column(Float)
    y = Column(Float)
    z = Column(Float)
    
    # Velocity (optional)
    vx = Column(Float)
    vy = Column(Float)
    vz = Column(Float)
    
    source = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow)

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()