import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { getExifData } from '../utils/exifUtils';
import { calculateDistance } from '../utils/locationUtils';

// Constants & Colors
const COLORS = {
    background: '#FFFFFF',
    primary: '#FF8C00',
    secondary: '#0000FF',
    accent: '#FF00FF', // Magenta for Next Button?
    text: '#000000',
    border: '#000000',
    success: '#00FF00',
    error: '#FF0000',
    disabled: '#a0a0a0',
    mapBackground: '#e0e0e0',
};
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA_DETAIL = 0.005; // Zoom in closer for single landmark
const LONGITUDE_DELTA_DETAIL = LATITUDE_DELTA_DETAIL * ASPECT_RATIO;
const VALIDATION_THRESHOLD_KM = 0.5;

function LandmarkScreen({ route, navigation }) {
    const { allLandmarks, currentIndex, cityId } = route.params;
    const currentLandmark = allLandmarks[currentIndex];

    const [imageInfo, setImageInfo] = useState(null); // Info for the current image attempt
    const [isVisited, setIsVisited] = useState(false);

    const storageKey = `@visitedStatus_${cityId}_${currentLandmark.id}`;

    // Load visited status on mount/landmark change
    useEffect(() => {
        const loadVisitedStatus = async () => {
            setImageInfo(null); // Reset image info when landmark changes
            try {
                const storedStatus = await AsyncStorage.getItem(storageKey);
                setIsVisited(storedStatus === 'true');
            } catch (e) {
                console.error('Failed to load visited status.', e);
                setIsVisited(false);
            }
        };
        loadVisitedStatus();
    }, [storageKey]); // Depend on storageKey which changes with landmark

    // Save visited status
    const saveVisitedStatus = async (status) => {
        try {
            await AsyncStorage.setItem(storageKey, String(status));
        } catch (e) {
            console.error('Failed to save visited status.', e);
        }
    };

    const landmarkRegion = {
        latitude: currentLandmark.latitude,
        longitude: currentLandmark.longitude,
        latitudeDelta: LATITUDE_DELTA_DETAIL,
        longitudeDelta: LONGITUDE_DELTA_DETAIL,
    };

    const pickAndValidateImage = async () => {
        if (isVisited) return; // Should be disabled, but double-check

        let result = await ImagePicker.launchImageLibraryAsync({ /* ... */ });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            const exif = await getExifData(imageUri);
            let infoText = 'Could not read EXIF data.';
            let validationStatus = 'error';

            if (exif) {
                const photoLat = exif.latitude;
                const photoLon = exif.longitude;
                const photoTime = exif.dateTimeOriginal;
                infoText = `Lat: ${photoLat?.toFixed(4)}, Lon: ${photoLon?.toFixed(4)}, Taken: ${photoTime || 'N/A'}`;

                if (photoLat !== null && photoLon !== null) {
                    const distance = calculateDistance(photoLat, photoLon, currentLandmark.latitude, currentLandmark.longitude);
                    if (distance !== null) {
                        const distanceMeters = (distance * 1000).toFixed(0);
                        if (distance <= VALIDATION_THRESHOLD_KM) {
                            infoText += `\n✅ Valid location! (${distanceMeters}m away)`;
                            validationStatus = 'success';
                            setIsVisited(true);
                            saveVisitedStatus(true);
                        } else {
                            infoText += `\n❌ Too far away! (${distanceMeters}m away)`;
                            validationStatus = 'failed';
                        }
                    } else { infoText += '\n❓ Could not calculate distance.'; validationStatus = 'warning'; }
                } else { infoText += '\n❓ No GPS data in photo.'; validationStatus = 'warning'; }
                Alert.alert(`Photo Info - ${currentLandmark.name}`, infoText);
            } else {
                Alert.alert('Error', infoText);
            }
            setImageInfo({ text: infoText, status: validationStatus });
        }
    };

    const handleNextLandmark = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < allLandmarks.length) {
            navigation.push('Landmark', {
                allLandmarks: allLandmarks,
                currentIndex: nextIndex,
                cityId: cityId,
            });
        } else {
            // Last landmark - Navigate to Quest Complete Screen
            Alert.alert("Quest Complete!", "Time for the final step.");
            navigation.replace('QuestComplete', { cityId }); // Use replace to prevent going back
        }
    };

    // Update navigation options dynamically
    useEffect(() => {
        navigation.setOptions({ title: currentLandmark.name });
    }, [navigation, currentLandmark]);

    return (
        <View style={styles.container}>
            {/* Map focused on the current landmark */}
            <MapView style={styles.map} initialRegion={landmarkRegion}>
                <Marker
                    coordinate={landmarkRegion}
                    title={currentLandmark.name}
                    pinColor={isVisited ? COLORS.success : COLORS.error}
                />
            </MapView>

            <View style={styles.detailsContainer}>
                <Text style={styles.landmarkName}>{currentLandmark.name} {isVisited ? '✅' : ''}</Text>
                <Text style={styles.description}>{currentLandmark.description}</Text>

                {/* Display validation attempt info */}
                {imageInfo && (
                    <Text style={[styles.exifText, styles[imageInfo.status]]}>
                        {imageInfo.text}
                    </Text>
                )}

                {/* Validate Button */}
                {!isVisited && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.button, styles.validateButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={pickAndValidateImage}
                    >
                        <Text style={styles.buttonText}>Validate Photo</Text>
                    </Pressable>
                )}

                {/* Next Button - shows only if visited */}
                {isVisited && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.button, styles.nextButton,
                            pressed && styles.buttonPressedNext, // Optional different press style
                        ]}
                        onPress={handleNextLandmark}
                    >
                        <Text style={styles.buttonText}>
                            {currentIndex + 1 < allLandmarks.length ? 'Next Landmark' : 'Finish Quest'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        height: height * 0.4, // Smaller map area
        width: '100%',
        borderBottomWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.mapBackground,
    },
    detailsContainer: {
        flex: 1,
        padding: 20,
    },
    landmarkName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16, // Larger description
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: COLORS.border,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
        alignItems: 'center',
        marginBottom: 15,
    },
    validateButton: {
        backgroundColor: COLORS.primary, // Orange
    },
    nextButton: {
        backgroundColor: COLORS.accent, // Magenta
    },
    buttonPressed: {
        backgroundColor: COLORS.secondary, // Blue press for validate
        shadowOffset: { width: 2, height: 2 },
    },
    buttonPressedNext: {
        backgroundColor: '#C71585', // Darker Magenta press for next
        shadowOffset: { width: 2, height: 2 },
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    exifText: {
        fontSize: 12,
        marginTop: 10,
        marginBottom: 15,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    success: { color: '#008000' },
    failed: { color: COLORS.error },
    warning: { color: '#FFA500' },
    error: { color: COLORS.error, fontWeight: 'bold' }
});

export default LandmarkScreen; 