import requests

def get_coordinates(place):
    url = f"https://nominatim.openstreetmap.org/search?q={place}&format=json"
    response = requests.get(url).json()
    
    if len(response) == 0:
        return None
    
    lat = response[0]["lat"]
    lon = response[0]["lon"]
    
    return lat, lon


def get_static_map(lat, lon):
    """
    Get static map image (OpenStreetMap)
    """
    map_url = f"https://static-maps.yandex.ru/1.x/?ll={lon},{lat}&size=450,450&z=10&l=map"
    
    response = requests.get(map_url)
    
    if response.status_code == 200:
        return response.content
    else:
        return None
