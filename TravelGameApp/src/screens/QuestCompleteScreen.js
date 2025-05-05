import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image, ScrollView, Alert, Dimensions } from 'react-native';
// Import Camera as the default export
import Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Placeholder for ML utils - create this file next
// import { analyzeSmile, detectLiveness } from '../utils/mlUtils';
// Uncomment and import the actual (placeholder) functions
import { analyzeSmile, detectLiveness } from '../utils/mlUtils';

// Constants & Colors
const COLORS = {
    background: '#FFFFFF',
    primary: '#FF8C00',
    secondary: '#0000FF',
    accent: '#FF00FF',
    text: '#000000',
    border: '#000000',
    success: '#00FF00',
    error: '#FF0000',
    disabled: '#a0a0a0',
    inputBackground: '#f0f0f0',
};
const { width } = Dimensions.get('window');

function QuestCompleteScreen({ route, navigation }) {
    // Safely access route params with optional chaining and default object
    const { cityId } = route?.params || {};
    const [notes, setNotes] = useState('');
    const [hasPermission, setHasPermission] = useState(null);
    const [selfieUri, setSelfieUri] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [smileResult, setSmileResult] = useState(null); // e.g., { score: 0.9, emoji: '😄' }
    const [livenessResult, setLivenessResult] = useState(null); // e.g., { score: 0.95, status: 'Real' }
    const cameraRef = useRef(null);

    // Request Camera Permission
    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            // Don't alert immediately, let user choose
            // if (status !== 'granted') {
            //     Alert.alert('Permission Denied', 'Camera access is needed to take a selfie.');
            // }
        })();
    }, []);

    const handleShowCamera = () => {
        if (hasPermission === null) {
            Alert.alert('Permission Pending', 'Checking camera permissions...');
            return;
        }
        if (hasPermission) {
            setShowCamera(true);
        } else {
            Alert.alert('Permission Denied', 'Camera access was denied. Please enable it in settings or upload from library.');
        }
    };

    // Function to pick image from library
    const pickImageFromLibrary = async () => {
        // Optional: Request library permissions if needed, though usually handled by picker
        // const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        // if (status !== 'granted') {
        //     Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        //     return;
        // }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Keep original for EXIF/analysis
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelfieUri(result.assets[0].uri);
            analyzeSelfie(result.assets[0].uri);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                setSelfieUri(photo.uri);
                setShowCamera(false);
                // Trigger ML analysis after taking picture
                analyzeSelfie(photo.uri);
            } catch (error) {
                console.error("Failed to take picture:", error);
                Alert.alert('Error', 'Could not take picture.');
                setShowCamera(false);
            }
        }
    };

    // Placeholder ML Analysis Function
    const analyzeSelfie = async (uri) => {
        // --- Placeholder --- Simulate analysis
        console.log('Simulating ML analysis on:', uri);
        setSmileResult('Analyzing Smile...');
        setLivenessResult('Analyzing Liveness...'); // Keep this for now
        // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

        // Replace with actual calls to mlUtils
        // const smileData = await analyzeSmile(uri);
        // const livenessData = await detectLiveness(uri);

        // Use the imported (placeholder) ML functions
        try {
            const smileData = await analyzeSmile(uri);
            setSmileResult(`Status: ${smileData.status} (${(smileData.score * 100).toFixed(0)}%)`);

            // We'll keep the liveness placeholder call for now, but focus on smile
            const livenessData = await detectLiveness(uri);
            setLivenessResult(`Status: ${livenessData.status} (${(livenessData.score * 100).toFixed(0)}%)`);

        } catch (error) {
            console.error("ML Analysis Error:", error);
            setSmileResult('Error during analysis.');
            setLivenessResult('Error during analysis.');
            Alert.alert("Analysis Failed", "Could not analyze the selfie.");
        }

        // --- Dummy Results ---
        // const smileData = { score: Math.random() * 0.6 + 0.4, status: 'Happy' }; // Bias towards happy
        // const livenessData = { score: Math.random() * 0.3 + 0.7, status: 'Real' }; // Bias towards real
        // --- End Dummy Results ---

        // setSmileResult(`Status: ${smileData.status} (${(smileData.score * 100).toFixed(0)}%)`);
        // setLivenessResult(`Status: ${livenessData.status} (${(livenessData.score * 100).toFixed(0)}%)`);
    };

    const handleFinish = async () => {
        // Optional: Save notes and results
        try {
            const questData = {
                notes,
                selfieUri, // Be careful saving URIs, they might be temporary
                smileResult,
                livenessResult,
                completedAt: new Date().toISOString(),
            };
            const storageKey = `@questCompletion_${cityId}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(questData));
            console.log('Quest data saved for city:', cityId);
        } catch (e) {
            console.error('Failed to save quest completion data.', e);
        }
        navigation.popToTop(); // Go back to start
    };

    if (showCamera) {
        return (
            <View style={styles.fullScreen}>
                <Camera style={styles.cameraPreview} type={'front'} ref={cameraRef} />
                <View style={styles.cameraControls}>
                    <Pressable style={styles.captureButton} onPress={takePicture} />
                    <Pressable style={styles.closeButton} onPress={() => setShowCamera(false)}>
                        <Text style={styles.closeButtonText}>X</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Quest Complete!</Text>
            <Text style={styles.subtitle}>Share your final thoughts</Text>

            {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
            ) : (
                // Show options if no selfie taken yet
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={({ pressed }) => [styles.button, styles.halfButton, styles.selfieButton, pressed && styles.buttonPressed]}
                        onPress={handleShowCamera}
                    >
                        <Text style={styles.buttonText}>Take Selfie</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.button, styles.halfButton, styles.uploadButton, pressed && styles.buttonPressed]}
                        onPress={pickImageFromLibrary}
                    >
                        <Text style={styles.buttonText}>Upload</Text>
                    </Pressable>
                </View>
            )}

            {/* Display ML Results - Conditionally render only if selfie exists */}
            {selfieUri && smileResult && <Text style={styles.resultText}>Smile Analysis: {smileResult}</Text>}
            {selfieUri && livenessResult && <Text style={styles.resultText}>Liveness Check: {livenessResult}</Text>}

            {/* Only show notes and finish button if selfie is present */}
            {selfieUri && (
                <>
                    <Text style={styles.label}>Notes about your Quest:</Text>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        numberOfLines={4}
                        onChangeText={setNotes}
                        value={notes}
                        placeholder="How was your adventure?"
                    />
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            styles.finishButton,
                            (!smileResult || !livenessResult || smileResult === 'Analyzing Smile...' || livenessResult === 'Analyzing Liveness...') && styles.buttonDisabled, // Disable while analyzing
                            pressed && styles.buttonPressedFinish
                        ]}
                        onPress={handleFinish}
                        disabled={!smileResult || !livenessResult || smileResult === 'Analyzing Smile...' || livenessResult === 'Analyzing Liveness...'} // Require analysis results
                    >
                        <Text style={[styles.buttonText, (!smileResult || !livenessResult || smileResult === 'Analyzing Smile...' || livenessResult === 'Analyzing Liveness...') && styles.buttonTextDisabled]}>
                            FINISH & EXIT
                        </Text>
                    </Pressable>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        padding: 20,
        alignItems: 'center',
    },
    fullScreen: {
        flex: 1,
    },
    cameraPreview: {
        flex: 1,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.background,
        borderWidth: 4,
        borderColor: COLORS.primary,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: COLORS.background,
        fontSize: 14,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#555',
        marginBottom: 25,
        textAlign: 'center',
    },
    buttonContainer: { // Container for the two initial buttons
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    halfButton: {
        width: '45%', // Make buttons take up roughly half width
    },
    selfieButton: {
        backgroundColor: COLORS.secondary, // Blue for selfie button
    },
    uploadButton: {
        backgroundColor: COLORS.primary, // Orange for upload
    },
    selfiePreview: {
        width: width * 0.6,
        height: width * 0.6 * (4 / 3), // Assume 4:3 aspect ratio
        resizeMode: 'cover',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginTop: 15,
    },
    textInput: {
        backgroundColor: COLORS.inputBackground,
        borderWidth: 2,
        borderColor: COLORS.border,
        width: '100%',
        height: 100,
        padding: 10,
        marginBottom: 25,
        fontSize: 16,
        textAlignVertical: 'top',
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
        // width: '90%', // Removed fixed width for halfButton layout
    },
    finishButton: {
        backgroundColor: COLORS.accent, // Magenta finish
        width: '90%', // Finish button can be wider
    },
    buttonPressed: {
        shadowOffset: { width: 2, height: 2 },
        opacity: 0.8,
    },
    buttonPressedFinish: {
        backgroundColor: '#C71585',
        shadowOffset: { width: 2, height: 2 },
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    buttonDisabled: {
        backgroundColor: COLORS.disabled,
        borderColor: '#707070',
        shadowColor: '#707070',
    },
    buttonTextDisabled: {
        color: '#555',
    },
    resultText: {
        fontSize: 14,
        marginTop: 5,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default QuestCompleteScreen; 