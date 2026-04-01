import numpy as np

def predict_flood(image_array, center_lat, center_lon):
    """
    Simulated Mask R-CNN style flood detection
    
    Args:
        image_array: Input satellite image
        center_lat: Latitude of search location
        center_lon: Longitude of search location
    
    Returns:
        List of detected flood regions with properties
    """
    
    try:
        h, w = image_array.shape[:2]
        
        # Simulated flood regions for demo (no complex processing)
        flood_regions = []
        
        # Generate 2-4 random flood regions
        num_regions = np.random.randint(2, 5)
        
        for i in range(num_regions):
            # Random distance (0-100km)
            distance = np.random.uniform(5, 95)
            
            # Determine color based on distance
            if distance < 20:
                severity = 'high'
                color = 'red'
            elif distance < 50:
                severity = 'medium'
                color = 'yellow'
            else:
                severity = 'low'
                color = 'green'
            
            # Random location offset within 100km radius
            lat_offset = np.random.uniform(-1, 1)
            lon_offset = np.random.uniform(-1, 1)
            
            region = {
                'center_lat': float(center_lat + lat_offset),
                'center_lon': float(center_lon + lon_offset),
                'pixel_coords': {
                    'min_x': int(w * 0.2),
                    'max_x': int(w * 0.4),
                    'min_y': int(h * 0.2),
                    'max_y': int(h * 0.4)
                },
                'area': int(np.random.randint(500, 5000)),
                'confidence': float(np.random.uniform(0.65, 0.95)),
                'distance_km': float(distance),
                'severity': severity,
                'color': color
            }
            flood_regions.append(region)
        
        return flood_regions
    
    except Exception as e:
        print(f"Error in predict_flood: {e}")
        return []

