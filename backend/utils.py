import requests

def get_coordinates(place):
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={place}&format=json"
        headers = {
            'User-Agent': 'FloodAlert/1.0 (Flood Detection System)'
        }
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code != 200:
            print(f"Nominatim API error: {response.status_code}")
            return None
            
        data = response.json()
        
        if len(data) == 0:
            print(f"No results found for: {place}")
            return None
        
        lat = float(data[0]["lat"])
        lon = float(data[0]["lon"])
        
        print(f"✓ Found coordinates for {place}: {lat}, {lon}")
        return lat, lon
    
    except requests.exceptions.Timeout:
        print(f"Timeout fetching coordinates for {place}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None
    except (KeyError, ValueError, IndexError) as e:
        print(f"Error processing coordinates: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error in get_coordinates: {e}")
        return None


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
