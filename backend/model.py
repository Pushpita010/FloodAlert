import numpy as np

def predict_flood(image_array):
    """
    Dummy flood detection model
    Returns a mask (0 = no flood, 1 = flood)
    """
    
    h, w, _ = image_array.shape
    
    # Simulated flood regions
    mask = np.zeros((h, w))
    
    # Random flood patches
    mask[h//4:h//2, w//4:w//2] = 1
    mask[h//2:3*h//4, w//2:3*w//4] = 1
    
    return mask.tolist()
