import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Shared Colors
const COLORS = {
    background: '#FFFFFF',
    primary: '#FF8C00',
    secondary: '#0000FF',
    text: '#000000',
    border: '#000000',
    mapBackground: '#e0e0e0',
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

function CityIntroScreen({ route, navigation }) {
    const { city } = route.params;
    const landmarks = city.landmarks || [];

    const initialRegion = landmarks.length > 0 ? {
        latitude: landmarks[0].latitude,
        longitude: landmarks[0].longitude,
        latitudeDelta: LATITUDE_DELTA * 1.5, // Zoom out slightly more
        longitudeDelta: LONGITUDE_DELTA * 1.5,
    } : null;

    const handleStartQuest = () => {
        if (landmarks.length > 0) {
            navigation.navigate('Landmark', {
                allLandmarks: landmarks,
                currentIndex: 0,
                cityId: city.id, // Pass cityId for storage key
            });
        } else {
            // Handle case with no landmarks
            alert('No landmarks found for this city!');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{city.name} History Quest</Text>

            {initialRegion && (
                <MapView style={styles.map} initialRegion={initialRegion}>
                    {landmarks.map(landmark => (
                        <Marker
                            key={landmark.id}
                            coordinate={{ latitude: landmark.latitude, longitude: landmark.longitude }}
                            title={landmark.name}
                        />
                    ))}
                </MapView>
            )}

            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                ]}
                onPress={handleStartQuest}
            >
                <Text style={styles.buttonText}>Start Quest</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    map: {
        height: height * 0.5, // Take half the screen height
        width: '100%',
        marginBottom: 25,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.mapBackground,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: COLORS.border,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
        width: '80%', // Make button wider
        alignItems: 'center',
    },
    buttonPressed: {
        backgroundColor: COLORS.secondary,
        shadowOffset: { width: 2, height: 2 },
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 20, // Larger text
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});

export default CityIntroScreen; 