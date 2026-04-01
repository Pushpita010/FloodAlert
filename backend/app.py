from flask import Flask, request, jsonify
from utils import get_coordinates, get_static_map
from model import predict_flood
from PIL import Image
import io
import numpy as np
import base64

app = Flask(__name__)


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
    # Adjust zoom to capture larger area (100km radius)
    image_bytes = get_static_map(lat, lon, zoom=9)  # Zoom 9 captures ~100km area
    
    if not image_bytes:
        return jsonify({"error": "Map fetch failed"}), 500
    
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
