import tensorflow as tf
import numpy as np
from PIL import Image
import argparse
import os

# --- Constants (should match training script) ---
IMG_HEIGHT = 224
IMG_WIDTH = 224
# Construct path relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'happy_sad_mobilenetv2.tflite')
CLASS_NAMES = ['happy', 'sad'] # Based on training output: {'happy': 0, 'sad': 1}

def preprocess_image(image_path):
    """Loads and preprocesses an image for the MobileNetV2 TFLite model."""
    try:
        img = Image.open(image_path).convert('RGB')
        img = img.resize((IMG_WIDTH, IMG_HEIGHT))
        img_array = np.array(img, dtype=np.float32)
        # Normalize pixels to [-1, 1] (matching tf.keras.applications.mobilenet_v2.preprocess_input)
        img_array = (img_array / 127.5) - 1.0
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        return None
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def predict(image_path):
    """Runs inference on a single image using the TFLite model."""
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        print("Please ensure the training script ran successfully.")
        return

    # Load the TFLite model and allocate tensors.
    try:
        interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
        interpreter.allocate_tensors()
    except Exception as e:
        print(f"Error loading TFLite model: {e}")
        return

    # Get input and output tensors.
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Preprocess the image
    input_data = preprocess_image(image_path)
    if input_data is None:
        return # Error handled in preprocess_image

    # Ensure input data type matches model's expected type
    if input_data.dtype != input_details[0]['dtype']:
         input_data = input_data.astype(input_details[0]['dtype'])

    # Set the value of the input tensor.
    interpreter.set_tensor(input_details[0]['index'], input_data)

    # Run inference.
    interpreter.invoke()

    # Get the results.
    output_data = interpreter.get_tensor(output_details[0]['index'])
    prediction = output_data[0][0] # Output is [[score]] for binary classification

    # Interpret the prediction (Sigmoid output)
    # Closer to 0 means CLASS_NAMES[0] ('happy'), closer to 1 means CLASS_NAMES[1] ('sad')
    predicted_class_index = 1 if prediction >= 0.5 else 0
    predicted_class_name = CLASS_NAMES[predicted_class_index]
    confidence = prediction if predicted_class_index == 1 else 1 - prediction

    print(f"Prediction for {os.path.basename(image_path)}:")
    print(f" - Class: {predicted_class_name}")
    print(f" - Confidence: {confidence:.4f}")
    print(f" - Raw Score: {prediction:.4f} (0 -> '{CLASS_NAMES[0]}', 1 -> '{CLASS_NAMES[1]}')")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Classify an image as happy or sad.')
    parser.add_argument('image_path', type=str, help='Path to the input image file.')
    args = parser.parse_args()

    predict(args.image_path) 