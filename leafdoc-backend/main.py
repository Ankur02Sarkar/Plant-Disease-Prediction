
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import tensorflow as tf
import numpy as np
import json
import os
from PIL import Image
import io
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Plant Disease Prediction API",
    description="API for detecting plant diseases from images",
    version="1.0.0"
)

# Load environment variables
MODEL_PATH = os.getenv("MODEL_PATH", "models/plant_disease_model.keras")
CLASS_INDICES_PATH = "models/class_indices.json"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and class names
model = None
class_names = []

# Mock database of generic treatments (would be replaced by real DB or detailed JSON)
TREATMENTS = {
    "healthy": {
        "prevention": "Continue regular care.",
        "action": "Monitor for any changes."
    },
    "default": {
        "prevention": "Ensure proper spacing, watering, and soil health.",
        "action": "Isolate affected plant, remove diseased parts, apply appropriate fungicide/bactericide."
    }
}

@app.on_event("startup")
async def startup_event():
    global model, class_names
    try:
        if os.path.exists(MODEL_PATH):
            logger.info(f"Loading model from {MODEL_PATH}...")
            model = tf.keras.models.load_model(MODEL_PATH)
            logger.info("Model loaded successfully.")
        else:
            logger.warning(f"Model not found at {MODEL_PATH}. API will not be able to predict.")

        if os.path.exists(CLASS_INDICES_PATH):
            with open(CLASS_INDICES_PATH, 'r') as f:
                class_names = json.load(f)
            logger.info(f"Loaded {len(class_names)} classes.")
        else:
            logger.warning(f"Class indices not found at {CLASS_INDICES_PATH}.")
            
    except Exception as e:
        logger.error(f"Error loading model: {e}")

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(image)
        # MobileNetV3 expects specific preprocessing possibly, but we used a preprocessing layer in the model?
        # In train_model.py: x = tf.keras.applications.mobilenet_v3.preprocess_input(x)
        # Since that is PART OF THE MODEL (we built it that way), we just need to pass the image array.
        # But `img_to_array` returns 0-255 float.
        # The model's preprocessing layer usually expects 0-255 inputs if it's included in the model.
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image format")

@app.get("/")
def read_root():
    return {"message": "Plant Disease Prediction API is running"}

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    if not model or not class_names:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        processed_image = preprocess_image(contents)
        
        predictions = model.predict(processed_image)
        score = tf.nn.softmax(predictions[0]) # if model output is logits. 
        # Wait, in train_model.py I used `activation='softmax'`. So predictions[0] is already probabilities.
        probabilities = predictions[0]
        
        predicted_class_index = np.argmax(probabilities)
        predicted_class = class_names[predicted_class_index]
        confidence = float(probabilities[predicted_class_index])
        
        # Get top 3
        top_3_indices = probabilities.argsort()[-3:][::-1]
        top_3_predictions = [
            {"disease": class_names[i], "probability": float(probabilities[i])}
            for i in top_3_indices
        ]
        
        # Get treatment info
        treatment_info = TREATMENTS.get(predicted_class.split("___")[-1], TREATMENTS.get("default"))
        if "healthy" in predicted_class:
             treatment_info = TREATMENTS["healthy"]

        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "top_3_predictions": top_3_predictions,
            "disease_stage": "Unknown", # Requires more specific logic/models
            "prevention": treatment_info["prevention"],
            "action": treatment_info["action"]
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
