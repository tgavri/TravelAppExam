import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Input, Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import os
import numpy as np

# --- Constants ---
IMG_HEIGHT = 224
IMG_WIDTH = 224
IMG_SHAPE = (IMG_HEIGHT, IMG_WIDTH, 3)
BATCH_SIZE = 32
EPOCHS = 25 # Increase epochs for potentially better training
DATA_DIR = 'sad_happy_dataset/data' # Relative path within ml_model
MODEL_SAVE_PATH = 'happy_sad_saved_model' # Directory for SavedModel format
TFLITE_SAVE_PATH = 'happy_sad_mobilenetv2.tflite'

print(f"TensorFlow Version: {tf.__version__}")
print(f"Using dataset directory: {os.path.abspath(DATA_DIR)}")

# --- Data Preprocessing and Augmentation ---
# Rescale pixel values from [0, 255] to [-1, 1] as expected by MobileNetV2
# Use a validation split for evaluating performance during training
datagen = ImageDataGenerator(
    rescale=1./127.5, # Rescale to [-1, 1]
    preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
    validation_split=0.2, # Use 20% of data for validation
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

train_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='binary', # Since we have 'happy' and 'sad'
    subset='training' # Specify this is the training set
)

validation_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='validation' # Specify this is the validation set
)

# Verify class indices
print(f"Class Indices: {train_generator.class_indices}")

# --- Model Building (Transfer Learning with MobileNetV2) ---
# Load MobileNetV2 pre-trained on ImageNet, exclude the top classification layer
base_model = MobileNetV2(input_shape=IMG_SHAPE,
                         include_top=False, # Exclude the final classification layer
                         weights='imagenet')

# Freeze the base model layers to leverage pre-trained weights
base_model.trainable = False

# Add custom classification layers on top
# Use functional API for more flexibility
inputs = Input(shape=IMG_SHAPE)
x = base_model(inputs, training=False) # Pass base model output
x = GlobalAveragePooling2D()(x) # Pool features
x = Dropout(0.2)(x) # Add dropout for regularization
# Final classification layer: 1 neuron (binary) with sigmoid activation
outputs = Dense(1, activation='sigmoid')(x)

model = Model(inputs, outputs)

# --- Compile the Model ---
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
              loss='binary_crossentropy', # Suitable for binary classification
              metrics=['accuracy'])

model.summary() # Print model architecture

# --- Train the Model ---
print("Starting model training...")
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    validation_steps=validation_generator.samples // BATCH_SIZE
)
print("Model training finished.")

# --- Save the Trained Keras Model ---
print(f"Saving Keras model to {MODEL_SAVE_PATH} (SavedModel format)")
model.export(MODEL_SAVE_PATH) # Use export() for SavedModel directory format
print("SavedModel saved.")

# --- Convert to TensorFlow Lite ---
print("Converting model to TensorFlow Lite...")
# Load from the SavedModel directory
converter = tf.lite.TFLiteConverter.from_saved_model(MODEL_SAVE_PATH)
# Optional: Add optimizations (e.g., quantization) here if needed later
tflite_model = converter.convert()

# Save the TFLite model
with open(TFLITE_SAVE_PATH, 'wb') as f:
    f.write(tflite_model)
print(f"TensorFlow Lite model saved to {TFLITE_SAVE_PATH}")

print("Script finished successfully!") 