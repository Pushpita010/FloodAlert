import requests

def get_coordinates(place):
    url = f"https://nominatim.openstreetmap.org/search?q={place}&format=json"
    response = requests.get(url).json()
    
    if len(response) == 0:
        return None
    
    lat = response[0]["lat"]
    lon = response[0]["lon"]
    
    return lat, lon


def get_static_map(lat, lon, zoom=10, size=450):
    """
    Get static map image (OpenStreetMap via Yandex API)
    
    Args:
        lat: Latitude
        lon: Longitude
        zoom: Zoom level (9 = ~100km, 10 = ~50km)
        size: Image size in pixels
    
    Returns:
        Image bytes or None
    """
    map_url = f"https://static-maps.yandex.ru/1.x/?ll={lon},{lat}&size={size},{size}&z={zoom}&l=sat"
    
    response = requests.get(map_url)
    
    if response.status_code == 200:
        return response.content
    else:
        return None
