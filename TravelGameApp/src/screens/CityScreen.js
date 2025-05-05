import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getExifData } from '../utils/exifUtils'; // Import the utility function
import { calculateDistance } from '../utils/locationUtils'; // Import distance calculation
import MapView, { Marker } from 'react-native-maps'; // Import MapView and Marker

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922; // Adjust for desired zoom level
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const VALIDATION_THRESHOLD_KM = 0.1; // 100 meters threshold for validation

// Neo-Brutalist Colors
const COLORS = {
    background: '#FFFFFF',
    primary: '#FF8C00', // Deep Orange
    secondary: '#0000FF', // Bright Blue
    accent: '#FF00FF', // Magenta
    text: '#000000',
    border: '#000000',
    success: '#00FF00', // Lime Green
    error: '#FF0000', // Bright Red
    disabled: '#a0a0a0',
    mapBackground: '#e0e0e0',
};

function CityScreen({ route }) {
    // Get the city data passed from HomeScreen
    const { city } = route.params;

    // Use the landmarks from the passed city object
    const landmarks = city.landmarks || [];
    const [selectedImageInfo, setSelectedImageInfo] = useState({}); // Store EXIF info per landmark
    const [visitedLandmarks, setVisitedLandmarks] = useState({}); // State for visited status

    const storageKey = `@visitedLandmarks_${city.id}`;

    // Load visited landmarks from AsyncStorage on mount
    useEffect(() => {
        const loadVisited = async () => {
            try {
                const storedVisited = await AsyncStorage.getItem(storageKey);
                if (storedVisited !== null) {
                    setVisitedLandmarks(JSON.parse(storedVisited));
                }
            } catch (e) {
                console.error('Failed to load visited landmarks.', e);
            }
        };
        loadVisited();
    }, [storageKey]); // Rerun if storageKey changes (though it won't here)

    // Save visited landmarks to AsyncStorage
    const saveVisited = async (newVisitedState) => {
        try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(newVisitedState));
        } catch (e) {
            console.error('Failed to save visited landmarks.', e);
        }
    };

    // Calculate initial region for the map based on the first landmark
    const initialRegion = landmarks.length > 0 ? {
        latitude: landmarks[0].latitude,
        longitude: landmarks[0].longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
    } : null;

    const pickImage = async (landmark) => {
        // Request permissions if needed (though expo-image-picker handles this on web/simulator)
        // For native, you might need MediaLibrary permissions
        // const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        // if (status !== 'granted') {
        //   Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        //   return;
        // }

        const landmarkId = landmark.id;

        // If already visited, don't do anything
        if (visitedLandmarks[landmarkId]) {
            Alert.alert('Already Visited', `You have already validated ${landmark.name}!`);
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // EXIF data might be lost if edited
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            console.log('Selected image URI:', imageUri);

            // Get EXIF data
            const exif = await getExifData(imageUri);
            console.log('Extracted EXIF:', exif);

            let infoText = 'Could not read EXIF data.';
            let validationStatus = 'error';
            let isValid = false;

            if (exif) {
                const photoLat = exif.latitude;
                const photoLon = exif.longitude;
                const photoTime = exif.dateTimeOriginal;

                infoText = `Lat: ${photoLat?.toFixed(4)}, Lon: ${photoLon?.toFixed(4)}, Taken: ${photoTime || 'N/A'}`;

                if (photoLat !== null && photoLon !== null) {
                    const distance = calculateDistance(
                        photoLat,
                        photoLon,
                        landmark.latitude,
                        landmark.longitude
                    );

                    if (distance !== null) {
                        const distanceMeters = (distance * 1000).toFixed(0);
                        if (distance <= VALIDATION_THRESHOLD_KM) {
                            infoText += `\n✅ Valid location! (${distanceMeters}m away)`;
                            validationStatus = 'success';
                            isValid = true; // Mark as valid
                            // ----> Mark landmark as visited
                            const updatedVisited = { ...visitedLandmarks, [landmarkId]: true };
                            setVisitedLandmarks(updatedVisited);
                            saveVisited(updatedVisited); // Persist the change
                        } else {
                            infoText += `\n❌ Too far away! (${distanceMeters}m away)`;
                            validationStatus = 'failed';
                        }
                    } else {
                        infoText += '\n❓ Could not calculate distance.';
                        validationStatus = 'warning';
                    }
                } else {
                    infoText += '\n❓ No GPS data in photo.';
                    validationStatus = 'warning';
                }

                Alert.alert(`Photo Info - ${landmark.name}`, infoText);
            } else {
                Alert.alert('Error', infoText);
            }

            setSelectedImageInfo(prev => ({
                ...prev,
                [landmarkId]: { text: infoText, status: validationStatus },
            }));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Landmarks in {city.name}:</Text>

            {/* Add MapView */}
            {initialRegion && (
                <MapView
                    style={styles.map}
                    initialRegion={initialRegion}
                >
                    {landmarks.map(landmark => (
                        <Marker
                            key={landmark.id}
                            coordinate={{
                                latitude: landmark.latitude,
                                longitude: landmark.longitude,
                            }}
                            title={landmark.name}
                            description={landmark.description}
                            pinColor={visitedLandmarks[landmark.id] ? COLORS.success : COLORS.error}
                        />
                    ))}
                </MapView>
            )}

            {/* Landmark List */}
            <FlatList
                style={styles.list}
                data={landmarks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isVisited = visitedLandmarks[item.id];
                    return (
                        <View style={[styles.landmarkItem, isVisited && styles.visitedItem]}>
                            <Text style={styles.landmarkName}>{item.name} {isVisited ? '✅' : ''}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.button,
                                    isVisited && styles.buttonDisabled,
                                    pressed && !isVisited && styles.buttonPressed,
                                ]}
                                onPress={() => pickImage(item)}
                                disabled={isVisited}
                            >
                                <Text style={[styles.buttonText, isVisited && styles.buttonTextDisabled]}>
                                    {isVisited ? "VALIDATED" : "VALIDATE PHOTO"}
                                </Text>
                            </Pressable>
                            {selectedImageInfo[item.id] && (
                                <Text style={[styles.exifText, styles[selectedImageInfo[item.id].status]]}>
                                    {selectedImageInfo[item.id].text}
                                </Text>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15, // Slightly reduce padding
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderColor: COLORS.border,
        paddingBottom: 8,
    },
    map: {
        height: 200,
        width: '100%',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.mapBackground,
    },
    list: {
        flex: 1,
    },
    landmarkItem: {
        padding: 15,
        backgroundColor: COLORS.background,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: COLORS.border,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 0,
    },
    visitedItem: {
        borderColor: COLORS.success,
        backgroundColor: '#e8ffe8', // Keep light green bg for visited
    },
    landmarkName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5,
    },
    description: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
    },
    button: {
        backgroundColor: COLORS.primary, // Yellow button
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: COLORS.border,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        marginTop: 5,
    },
    buttonPressed: {
        backgroundColor: COLORS.secondary, // Blue when pressed
        shadowOffset: { width: 2, height: 2 },
    },
    buttonDisabled: {
        backgroundColor: COLORS.disabled,
        borderColor: '#707070',
        shadowColor: '#707070',
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    buttonTextDisabled: {
        color: '#555',
    },
    exifText: {
        fontSize: 11,
        marginTop: 10,
        fontStyle: 'italic',
    },
    success: { color: '#008000' }, // Standard Green
    failed: { color: COLORS.error }, // Bright Red
    warning: { color: '#FFA500' }, // Orange
    error: { color: COLORS.error, fontWeight: 'bold' }
});

export default CityScreen; 