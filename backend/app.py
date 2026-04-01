from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import get_coordinates, get_static_map
from model import predict_flood
from PIL import Image, ImageDraw
import io
import numpy as np
import base64
import random
from datetime import datetime, timedelta

app = Flask(__name__)

# Enable CORS with more permissive settings
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

def create_placeholder_image(width=450, height=450):
    """Create a placeholder image when satellite map is unavailable"""
    img = Image.new('RGB', (width, height), color=(200, 220, 240))
    draw = ImageDraw.Draw(img)
    # Add some patterns to simulate water areas
    for i in range(5):
        x = np.random.randint(0, width-50)
        y = np.random.randint(0, height-50)
        size = np.random.randint(30, 80)
        draw.ellipse([x, y, x+size, y+size], fill=(100, 150, 200))
    return img

def get_weather_data(lat, lon):
    """Get simulated weather data including water level and temperature
    In production, this would integrate with real weather APIs like OpenWeatherMap, NOAA, etc.
    """
    # Simulate seasonal temperature variations
    month = datetime.now().month
    base_temp = 25 + (5 * np.sin(2 * np.pi * (month - 1) / 12))  # Seasonal variation
    
    # Simulate latitude-based temperature variation
    temp_adjustment = -0.01 * abs(lat - 20)  # Cooler at higher latitudes
    
    # Water level simulation (in meters above normal)
    # Based on latitude (monsoon regions have higher water levels)
    normal_level = 2.5 + (0.5 * np.sin(2 * np.pi * (month - 1) / 12))
    level_variance = 0.3 * (np.sin(lat * 0.1) + np.cos(lon * 0.1))
    water_level = normal_level + level_variance
    
    # Temperature simulation
    min_temp = round(base_temp + temp_adjustment - 3 - random.uniform(0, 2), 1)
    max_temp = round(base_temp + temp_adjustment + 5 + random.uniform(0, 2), 1)
    current_temp = round((min_temp + max_temp) / 2 + random.uniform(-1, 1), 1)
    
    return {
        "water_level_m": round(water_level, 2),
        "water_level_status": "Normal" if water_level < 3 else "Elevated" if water_level < 4 else "Critical",
        "current_temperature_c": current_temp,
        "min_temperature_c": min_temp,
        "max_temperature_c": max_temp,
        "humidity_percent": random.randint(40, 95),
        "rainfall_mm": round(random.uniform(0, 15), 1),
        "last_updated": datetime.now().isoformat()
    }

@app.route("/")
def home():
    return {"message": "Flood Detection API Running"}


@app.route("/detect", methods=["POST"])
def detect_flood():
    try:
        data = request.json
        place = data.get("place")
        
        if not place:
            return jsonify({"error": "Place name required"}), 400
        
        # 1. Get coordinates
        coords = get_coordinates(place)
        
        if not coords:
            return jsonify({"error": "Invalid location"}), 404
        
        lat, lon = coords
        
        # 2. Get map image for 100km radius (larger zoom)
        # Try to fetch satellite map, use placeholder if it fails
        image_bytes = get_static_map(lat, lon, zoom=9)  # Zoom 9 captures ~100km area
        
        if not image_bytes:
            # Create placeholder image if map fetch fails
            img = create_placeholder_image()
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            image_bytes = img_buffer.getvalue()
            print(f"⚠️  Using placeholder image for {place}")
        
        # 3. Convert image to array
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        
        # 4. ML prediction - Mask R-CNN style flood detection
        flood_regions = predict_flood(image_array, lat, lon)
        
        # 5. Sort regions by distance (closest first)
        flood_regions = sorted(flood_regions, key=lambda x: x['distance_km'])
        
        # 6. Get weather data (water level & temperature)
        weather_data = get_weather_data(lat, lon)
        
        # 7. Skip base64 image for now - focus on data
        # encoded_img = base64.b64encode(image_bytes).decode("utf-8")
        
        # 8. Prepare response with color-coded regions
        response_data = {
            "success": True,
            "place": place,
            "latitude": lat,
            "longitude": lon,
            "search_radius_km": 100,
            "flood_regions": flood_regions,
            "total_regions": len(flood_regions),
            "region_summary": {
                "high_risk": len([r for r in flood_regions if r['severity'] == 'high']),
                "medium_risk": len([r for r in flood_regions if r['severity'] == 'medium']),
                "low_risk": len([r for r in flood_regions if r['severity'] == 'low'])
            },
            "weather": weather_data
        }
        
        print(f"✓ Sending response for {place} with {len(flood_regions)} regions")
        return jsonify(response_data)
    
    except Exception as e:
        print(f"✗ Error in detect_flood: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Detection failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
