import face_recognition
import cv2
import numpy as np
import base64
from typing import Optional, List

def base64_to_image(base64_string: str) -> np.ndarray:
    """Converts a base64 encoded image string to an OpenCV image."""
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_data = base64.b64decode(base64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

class FaceService:
    @staticmethod
    def enroll_face(image_base64: str) -> Optional[List[float]]:
        """
        Extracts a 128-dimensional face encoding from a base64 image.
        Returns the encoding if exactly one face is found, else None.
        """
        img = base64_to_image(image_base64)
        if img is None:
            return None
            
        # Convert BGR (OpenCV format) to RGB (face_recognition format)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect face locations
        face_locations = face_recognition.face_locations(rgb_img)
        if len(face_locations) != 1:
            return None # Must have exactly one face
            
        # Extract face encodings
        encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(encodings) > 0:
            return encodings[0].tolist()
        return None

    @staticmethod
    def verify_face(image_base64: str, stored_encoding: List[float], tolerance: float = 0.5) -> dict:
        """
        Verifies a live face against a stored 128-dimensional encoding.
        Returns dict with match status and Euclidean distance.
        """
        img = base64_to_image(image_base64)
        if img is None:
            return {"match": False, "error": "Invalid image"}
            
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0:
            return {"match": False, "error": "No face detected"}
        if len(face_locations) > 1:
            return {"match": False, "error": "Multiple faces detected"}
            
        current_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if not current_encodings:
            return {"match": False, "error": "Could not extract face encoding"}
            
        current_encoding = current_encodings[0]
        known_encoding = np.array(stored_encoding)
        
        # Calculate Euclidean distance
        # Lower distance means more similar. Default tolerance is usually 0.6.
        distance = face_recognition.face_distance([known_encoding], current_encoding)[0]
        match = distance <= tolerance
        
        # Basic liveness simulation (In a real enterprise app, you'd integrate active/passive liveness models here)
        liveness_passed = True
        
        return {
            "match": bool(match),
            "distance": float(distance),
            "liveness_passed": liveness_passed
        }
