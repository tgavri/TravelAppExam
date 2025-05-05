# Project Requirements – Smile-Based Sentiment Detection App

## 📱 App Overview
An offline-capable React Native app where users take selfies, and a pre-trained machine learning model (trained on a happy/sad face dataset) analyzes their facial expressions to determine a "happiness score". This app could be used in scenarios like customer feedback terminals in physical stores, or travel experiences.

---

## 🧠 Machine Learning Scope

### ✅ Goal
- Classify facial expressions as either “happy” or “sad”.
- Provide a visual rating (smiley scale, e.g., 😞 to 😄) based on prediction confidence.

### ✅ Dataset
- **Dataset:** [Happy/Sad Face Detection Dataset on Kaggle](https://www.kaggle.com/datasets/alirezaatashnejad/sad-and-happy-face-detection)
- **Type:** Image classification (binary: happy vs. sad)
- **Model Input:** Image (selfie) only

### ✅ Model Usage
- Use a **pre-trained image classification model**, such as:
  - MobileNetV2 (TensorFlow Lite)
  - EfficientNet (lightweight & accurate)
- Fine-tune on the happy/sad dataset OR convert dataset to TFLite format and use directly.
- The model must be optimized for **on-device (offline) inference**.

### ✅ Model Deployment
- Convert trained model to **TensorFlow Lite (TFLite)**.
- Bundle it with the React Native app using:
  - `react-native-tflite` or `react-native-tensorflow-lite`

---

## 📦 React Native Scope

### ✅ App Functionality
- **Camera/Selfie Capture:**
  - Use `expo-image-picker` or `expo-camera`
- **Prediction Logic:**
  - Load and run the TFLite model locally on the captured image.
- **Feedback Display:**
  - Show predicted class (happy/sad)
  - Show a visual "emoji meter" representing prediction confidence.
- **EXIF Metadata:**
  - Extract EXIF data (time, GPS if available) from the image using:
    - `expo-media-library` or `expo-file-system` + `piexifjs`

### ✅ Extra (Optional)
- Allow batch upload of selfies with timestamps.
- Store offline results in local SQLite or AsyncStorage.
- Upload metadata + score to API/backend (optional for later).

---

## 👩‍💻 Technologies

| Stack | Tool |
|-------|------|
| Frontend | React Native (Expo) |
| Camera | expo-image-picker |
| ML Integration | TensorFlow Lite, react-native-tflite |
| EXIF | piexifjs / expo-media-library |
| Dataset Source | Kaggle |
| ML Training | Python, Keras, TensorFlow |
| Storage (optional) | SQLite / AsyncStorage |

---

## 🧪 Features to Implement

- [ ] Camera interface for selfie capture
- [ ] Local prediction of mood (happy/sad)
- [ ] EXIF data extraction (timestamp, geolocation)
- [ ] Emoji/score-based feedback on emotion
- [ ] Offline functionality (core features)
- [ ] (Optional) Local storage of mood + photo
- [ ] (Optional) API upload of emotion stats

---

## 🚀 Stretch Goals

- Use ML to track mood trends over time.
- Add liveness detection (basic implementation).
- Deploy on both Android and iOS.
- Gamify: unlock badges based on happy streaks.
