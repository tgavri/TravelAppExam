# Project Requirements – Travel Game App

## 🗺️ App Overview
A React Native mobile application designed to enhance travel experiences. Users select a city (e.g., Rome), explore its famous landmarks (e.g., Colosseum, Vatican City), and engage in location-based activities. A core mechanic involves using photos taken by the user; the app checks for EXIF data (like GPS location and timestamp) to potentially unlock content, validate visits, or progress in the game. The app should aim for offline capabilities where feasible.

---

## ✨ Core Features

### ✅ City & Landmark Exploration
-   **City Selection:** Allow users to choose from a predefined list of cities.
-   **Landmark Discovery:** Display key landmarks and points of interest within the selected city, possibly on a map interface.
-   **Information:** Provide brief descriptions, history, or interesting facts about each landmark.

### ✅ Photo Interaction & EXIF Validation
-   **Photo Upload/Capture:** Users can either take a photo within the app or upload one from their gallery.
-   **EXIF Data Extraction:**
    -   Read EXIF metadata from user photos, specifically focusing on:
        -   GPS Coordinates (Geolocation)
        -   Timestamp (Date/Time taken)
    -   Use libraries like `expo-image-picker` (for capturing/selecting) and potentially `expo-media-library` or `piexifjs` for EXIF reading.
-   **Gameplay Integration:** Use the extracted EXIF data to:
    -   Verify if a photo was taken near a specific landmark.
    -   Check if a photo was taken within a certain timeframe related to a task or challenge.
    -   Unlock achievements, points, or new content based on validated photos.

### ✅ Offline Capability
-   Store city/landmark data locally for offline access.
-   Allow core photo interaction and EXIF checking to work without an internet connection.
-   Cache user progress and potentially sync later when online.

---

## 📦 Technical Scope

| Category          | Tool/Technology                  | Notes                                           |
|-------------------|----------------------------------|-------------------------------------------------|
| **Frontend**      | React Native (Expo)              | Cross-platform development framework.           |
| **Navigation**    | React Navigation                 | For screen transitions.                         |
| **Mapping**       | `react-native-maps` (optional)   | To display landmarks visually on a map.         |
| **Camera/Gallery**| `expo-image-picker`, `expo-camera` | For capturing or selecting photos.              |
| **EXIF Handling** | `expo-media-library`, `piexifjs`   | To read metadata from image files.              |
| **Data Storage**  | AsyncStorage, SQLite (`expo-sqlite`) | For storing landmark data, user progress offline. |
| **Data Source**   | TBD (API, local JSON)            | Source for city and landmark information.       |
| **Backend (Optional)** | Python (Flask/FastAPI)          | Could serve city/landmark data via an API.     |

---

## 🧪 Potential Features & Stretch Goals

-   [ ] User accounts and profiles.
-   [ ] Gamification: Points, badges, leaderboards based on visited locations/completed tasks.
-   [ ] Augmented Reality (AR) features at landmarks.
-   [ ] Integration with external APIs for real-time data (weather, opening hours).
-   [ ] Social features: Share progress or photos with friends.
-   [ ] Downloadable offline map packages for cities.
-   [ ] Multi-language support.
-   [ ] **Landmark Image Recognition:** Use a CNN model (ML) to identify landmarks in photos as an alternative/addition to EXIF validation.
-   [ ] **LLM-Powered Content:** Utilize LLMs (Python/ML) for dynamic landmark descriptions or an in-app travel assistant/chatbot.
-   [ ] **User Pattern Analysis:** Apply ML techniques (Python/ML) to analyze anonymized user travel patterns (if data is collected).

---

## 🚦 Project Phases (High-Level)

1.  **Setup & Data:** Initialize project, define data structure for cities/landmarks, source initial data.
2.  **Core UI:** Implement city/landmark browsing and display.
3.  **Photo & EXIF:** Integrate camera/gallery access and EXIF reading logic.
4.  **Gameplay Logic:** Connect EXIF data to validation rules and user progression.
5.  **Offline Storage:** Implement local caching and offline functionality.
6.  **Testing & Refinement:** Test thoroughly, especially EXIF handling and offline modes.
7.  **(Optional) Stretch Goals:** Implement features from the list above. 