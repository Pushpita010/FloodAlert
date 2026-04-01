import numpy as np
from scipy import ndimage
from sklearn.cluster import DBSCAN

def predict_flood(image_array, center_lat, center_lon):
    """
    Mask R-CNN style flood detection with region analysis
    
    Args:
        image_array: Input satellite image
        center_lat: Latitude of search location
        center_lon: Longitude of search location
    
    Returns:
        List of detected flood regions with properties:
        - center_lat/lon: Region centroid coordinates
        - pixel_coords: Pixel coordinates of region bounds
        - area: Approximate area in pixels
        - confidence: Confidence score (0-1)
        - distance_km: Distance from search center
        - severity: 'high', 'medium', 'low'
        - color: 'red', 'yellow', 'green'
    """
    
    if len(image_array.shape) == 3:
        # Convert to grayscale to detect water/floods
        gray = np.mean(image_array[:, :, :3], axis=2)
    else:
        gray = image_array
    
    # Threshold to detect water bodies (dark blue/water areas)
    # Simulated flood detection - in real scenario would use trained model
    threshold = np.percentile(gray, 30)
    binary = gray < threshold
    
    # Morphological operations to clean up
    from scipy.ndimage import binary_dilation, binary_erosion
    binary = binary_erosion(binary_dilation(binary, iterations=2), iterations=1)
    
    # Label connected components
    labeled_array, num_features = ndimage.label(binary)
    
    # Find centroids and properties of each region
    flood_regions = []
    
    for region_id in range(1, num_features + 1):
        region_mask = (labeled_array == region_id)
        area = np.sum(region_mask)
        
        # Filter out very small regions (noise)
        if area < 100:
            continue
        
        # Get coordinates of region
        coords = np.argwhere(region_mask)
        
        if len(coords) == 0:
            continue
        
        # Calculate centroid
        centroid_y = np.mean(coords[:, 0])
        centroid_x = np.mean(coords[:, 1])
        
        # Get region bounds
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)
        
        # Convert pixel coordinates to lat/lon relative positions
        h, w = image_array.shape[:2]
        
        # Approximate conversion (simplified - uses 100km radius)
        # 100km radius = image dimensions, so each pixel = 100km / image_size
        km_per_pixel = 100.0 / (max(h, w) / 2)
        
        # Calculate centroid lat/lon relative to center
        lat_offset = (centroid_y - h/2) * km_per_pixel / 111.0  # 111 km per degree
        lon_offset = (centroid_x - w/2) * km_per_pixel / 111.0
        
        region_lat = center_lat + lat_offset
        region_lon = center_lon + lon_offset
        
        # Calculate distance from center in km
        distance_km = np.sqrt((lat_offset)**2 + (lon_offset)**2) * 111.0 / 111.0
        
        # Determine severity based on distance and size
        if distance_km < 20:
            severity = 'high'
            distance_band = 'red'
        elif distance_km < 50:
            severity = 'medium'
            distance_band = 'yellow'
        else:
            severity = 'low'
            distance_band = 'green'
        
        # Size-based confidence
        confidence = min(0.95, 0.5 + (area / (h * w)) * 0.45)
        
        flood_regions.append({
            'center_lat': float(region_lat),
            'center_lon': float(region_lon),
            'pixel_coords': {
                'min_x': int(min_x),
                'max_x': int(max_x),
                'min_y': int(min_y),
                'max_y': int(max_y)
            },
            'area': int(area),
            'confidence': float(confidence),
            'distance_km': float(distance_km),
            'severity': severity,
            'color': distance_band
        })
    
    return flood_regions
