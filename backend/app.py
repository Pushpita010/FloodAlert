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
    
    # 2. Get map image
    image_bytes = get_static_map(lat, lon)
    
    if not image_bytes:
        return jsonify({"error": "Map fetch failed"}), 500
    
    # 3. Convert image to array
    image = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image)
    
    # 4. ML prediction
    flood_mask = predict_flood(image_array)
    
    # 5. Convert image to base64 (for frontend)
    encoded_img = base64.b64encode(image_bytes).decode("utf-8")
    
    return jsonify({
        "place": place,
        "latitude": lat,
        "longitude": lon,
        "map_image": encoded_img,
        "flood_mask": flood_mask
    })


if __name__ == "__main__":
    app.run(debug=True)
