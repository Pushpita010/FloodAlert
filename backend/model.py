import numpy as np
import cv2
from scipy import ndimage

def predict_flood(image_array, center_lat, center_lon):
    """
    Real flood detection using water color detection on satellite images
    
    Args:
        image_array: Input satellite image (RGB or BGR)
        center_lat: Latitude of search location
        center_lon: Longitude of search location
    
    Returns:
        List of detected flood regions with properties
    """
    
    try:
        # Ensure image is in BGR format (OpenCV standard)
        if len(image_array.shape) == 2:
            # Grayscale image
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_GRAY2BGR)
        else:
            # Assume RGB, convert to BGR
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        h, w = image_bgr.shape[:2]
        
        # 1. Water detection using HSV color space
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        
        # Define water color ranges (blue/dark cyan in satellite images)
        # Lower bound: H, S, V
        lower_water = np.array([90, 50, 0])     # Blue-ish hue
        upper_water = np.array([130, 255, 200]) # Light blues
        
        # Create mask for water
        water_mask = cv2.inRange(hsv, lower_water, upper_water)
        
        # 2. Morphological operations to clean up noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        water_mask = cv2.morphologyEx(water_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        water_mask = cv2.morphologyEx(water_mask, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # 3. Find contours (flood regions)
        contours, _ = cv2.findContours(water_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        flood_regions = []
        
        # 4. Process each detected region
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter out very small regions (noise)
            if area < 500:
                continue
            
            # Get contour properties
            M = cv2.moments(contour)
            if M["m00"] == 0:
                continue
            
            # Centroid
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            
            # Bounding box
            x, y, w_box, h_box = cv2.boundingRect(contour)
            
            # Convexity
            hull = cv2.convexHull(contour)
            solidity = area / cv2.contourArea(hull) if cv2.contourArea(hull) > 0 else 0
            
            # Approximate distance from center (0 = center, 100 = edge)
            # Calculate distance in pixels and convert to km-like scale
            pixel_distance = np.sqrt((cx - w/2)**2 + (cy - h/2)**2)
            normalized_distance = (pixel_distance / (np.sqrt((w/2)**2 + (h/2)**2))) * 100
            
            # Determine severity based on area and solidity
            if area > 10000 and solidity > 0.7:
                severity = 'high'
                confidence = min(0.95, 0.7 + (solidity * 0.25))
            elif area > 5000 and solidity > 0.5:
                severity = 'medium'
                confidence = min(0.9, 0.6 + (solidity * 0.2))
            else:
                severity = 'low'
                confidence = min(0.85, 0.5 + (solidity * 0.15))
            
            # Color coding
            color_map = {
                'high': 'red',
                'medium': 'yellow',
                'low': 'green'
            }
            color = color_map[severity]
            
            # Map pixel coordinates to approximate lat/lon
            # Simple linear approximation: 100km ≈ 1 degree
            lat_offset = ((cy - h/2) / h) * 1.0  # approximate
            lon_offset = ((cx - w/2) / w) * 1.0  # approximate
            
            region = {
                'center_lat': float(center_lat + lat_offset),
                'center_lon': float(center_lon + lon_offset),
                'pixel_coords': {
                    'min_x': int(x),
                    'max_x': int(x + w_box),
                    'min_y': int(y),
                    'max_y': int(y + h_box),
                    'centroid_x': cx,
                    'centroid_y': cy
                },
                'area': int(area),
                'confidence': float(confidence),
                'distance_km': float(normalized_distance),
                'severity': severity,
                'color': color,
                'solidity': float(solidity)  # Shape regularity (0-1)
            }
            flood_regions.append(region)
        
        # Sort by confidence (highest first)
        flood_regions = sorted(flood_regions, key=lambda x: x['confidence'], reverse=True)
        
        # Limit to top 10 regions
        flood_regions = flood_regions[:10]
        
        return flood_regions
    
    except Exception as e:
        print(f"Error in predict_flood: {e}")
        import traceback
        traceback.print_exc()
        return []


