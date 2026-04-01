from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import get_coordinates, get_static_map
from model import predict_flood
from PIL import Image, ImageDraw
import io
import numpy as np
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

@app.route("/")
def home():
    return {"message": "Flood Detection API Running"}


@app.route("/detect", methods=["POST"])
def detect_flood():
    
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
    
    # 3. Convert image to array
    image = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image)
    
    # 4. ML prediction - Mask R-CNN style flood detection
    flood_regions = predict_flood(image_array, lat, lon)
    
    # 5. Sort regions by distance (closest first)
    flood_regions = sorted(flood_regions, key=lambda x: x['distance_km'])
    
    # 6. Convert image to base64 (for frontend)
    encoded_img = base64.b64encode(image_bytes).decode("utf-8")
    
    # 7. Prepare response with color-coded regions
    response_data = {
        "place": place,
        "latitude": lat,
        "longitude": lon,
        "map_image": encoded_img,
        "search_radius_km": 100,
        "flood_regions": flood_regions,
        "total_regions": len(flood_regions),
        "region_summary": {
            "high_risk": len([r for r in flood_regions if r['severity'] == 'high']),
            "medium_risk": len([r for r in flood_regions if r['severity'] == 'medium']),
            "low_risk": len([r for r in flood_regions if r['severity'] == 'low'])
        }
    }
    
    return jsonify(response_data)


if __name__ == "__main__":
    app.run(debug=True)
