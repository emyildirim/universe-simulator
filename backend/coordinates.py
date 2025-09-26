"""Coordinate conversion utilities using Astropy."""

import numpy as np
from astropy.coordinates import SkyCoord, ICRS
from astropy import units as u
from typing import Tuple, Optional

def ra_dec_parallax_to_cartesian(ra: float, dec: float, parallax: float) -> Tuple[float, float, float]:
    """
    Convert RA/Dec/parallax to 3D Cartesian coordinates (ICRS frame).
    
    Args:
        ra: Right Ascension in degrees
        dec: Declination in degrees
        parallax: Parallax in milliarcseconds
        
    Returns:
        Tuple of (x, y, z) coordinates in parsecs
    """
    if parallax <= 0:
        # For objects without parallax data, place at a default distance
        distance = 1000.0  # 1000 parsecs default
    else:
        # Distance in parsecs = 1000 / parallax_in_mas
        distance = 1000.0 / parallax
    
    # Create SkyCoord object
    coord = SkyCoord(
        ra=ra * u.degree,
        dec=dec * u.degree,
        distance=distance * u.parsec,
        frame=ICRS()
    )
    
    # Get Cartesian coordinates
    cartesian = coord.cartesian
    
    return float(cartesian.x.value), float(cartesian.y.value), float(cartesian.z.value)

def calculate_distance(x1: float, y1: float, z1: float, 
                      x2: float, y2: float, z2: float) -> float:
    """
    Calculate 3D Euclidean distance between two points.
    
    Args:
        x1, y1, z1: Coordinates of first point in parsecs
        x2, y2, z2: Coordinates of second point in parsecs
        
    Returns:
        Distance in parsecs
    """
    return np.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2)

def cartesian_to_ra_dec_distance(x: float, y: float, z: float) -> Tuple[float, float, float]:
    """
    Convert 3D Cartesian coordinates back to RA/Dec/distance.
    
    Args:
        x, y, z: Cartesian coordinates in parsecs
        
    Returns:
        Tuple of (ra, dec, distance) where ra/dec are in degrees and distance in parsecs
    """
    coord = SkyCoord(
        x=x * u.parsec,
        y=y * u.parsec,
        z=z * u.parsec,
        representation_type='cartesian',
        frame=ICRS()
    )
    
    return float(coord.ra.degree), float(coord.dec.degree), float(coord.distance.value)

def is_within_bbox(x: float, y: float, z: float, 
                  bbox_min: Tuple[float, float, float], 
                  bbox_max: Tuple[float, float, float]) -> bool:
    """
    Check if a point is within a 3D bounding box.
    
    Args:
        x, y, z: Point coordinates
        bbox_min: Minimum bounds (x_min, y_min, z_min)
        bbox_max: Maximum bounds (x_max, y_max, z_max)
        
    Returns:
        True if point is within the bounding box
    """
    x_min, y_min, z_min = bbox_min
    x_max, y_max, z_max = bbox_max
    
    return (x_min <= x <= x_max and 
            y_min <= y <= y_max and 
            z_min <= z <= z_max)