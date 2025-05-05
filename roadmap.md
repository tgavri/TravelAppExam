# 🗺️ Project Roadmap – Liveness Detection App via Selfie

## 🎯 Goal
Build an offline-capable React Native app that captures selfies, passes them through a pre-trained ML model, and detects liveness (e.g., real human vs spoof) using smile/movement patterns. Output is a **liveness score (%)**.

---

## 🔰 Phase 1 – Setup & Planning

### ✅ Week 1: Project Kickoff
- [ ] Define MVP scope (selfie input → liveness score)
- [ ] Research liveness detection datasets & models
- [ ] Set up GitHub repo and tooling
- [ ] Choose pre-trained model (e.g., **Anti-Spoofing Net**, **FaceLiveness Detection from InsightFace**, or ReplicateAI models)
- [ ] Define TFLite or ONNX format for mobile

---

## 🧠 Phase 2 – Machine Learning Model

### ✅ Week 2–3: Model Selection & Testing
- [ ] Download and test open-source liveness detection models:
  - [ ] Based on smile/head-pose (single-frame)
  - [ ] Prefer models that run offline (e.g. TFLite)
- [ ] Evaluate with test images
- [ ] Convert to mobile format (`.tflite`, `.onnx`)
- [ ] Document model input/output and expected dimensions

---

## 📱 Phase 3 – React Native App Development

### ✅ Week 4: Camera + EXIF Integration
- [ ] Set up Expo-based React Native app
- [ ] Use `expo-image-picker` or `react-native-camera` for selfie
- [ ] Extract EXIF data (orientation, timestamp, etc.)

### ✅ Week 5: ML Model Integration
- [ ] Integrate with `react-native-tflite` or `onnxruntime-react-native`
- [ ] Resize/crop image to fit model input
- [ ] Get liveness prediction from model
- [ ] Show liveness percentage to user

---

## 💾 Phase 4 – Offline Functionality

### ✅ Week 6–7: Local Result Storage & Offline Use
- [ ] Save selfie + liveness score locally (SQLite/AsyncStorage)
- [ ] Show history of tests with timestamp + result
- [ ] Ensure full offline flow (no API dependency)

---

## 💅 Phase 5 – UI/UX Polish

### ✅ Week 8: Visual Feedback
- [ ] Show animated feedback (e.g., ✅ for real, ❌ for spoof)
- [ ] Show exact liveness percentage (e.g., “Liveness: 92%”)
- [ ] Display EXIF info (date taken, location if available)

---

## 🚀 Phase 6 – Optional Enhancements

### ✅ Week 9–10: Bonus Features
- [ ] Add threshold logic (e.g., “above 80% = verified”)
- [ ] Allow sharing result or selfie export
- [ ] (Optional) Add secondary anti-spoofing checks (e.g., blink detection)
- [ ] Add ReplicateAI integration for cloud fallback (if user is online)

---

## ✅ Final Phase – Submission

### 🎓 Week 11–12: Final Polish
- [ ] Clean up code and repo
- [ ] Write documentation + user instructions
- [ ] Create a 2-minute demo video
- [ ] Submit final project & model

---

## 📌 Milestone Summary

| Week | Milestone                          |
|------|------------------------------------|
| 1    | Planning & dataset/model research  |
| 2–3  | Model testing + conversion         |
| 4    | App + selfie capture               |
| 5    | Model integration                  |
| 6–7  | Offline storage                    |
| 8    | UI/UX feedback                     |
| 9–10 | Bonus features                     |
| 11–12| Final polish & submission          |
