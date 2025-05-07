import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image, ScrollView, Alert, Dimensions } from 'react-native';
// Import Camera as the default export
import Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the updated ML utility functions
import { analyzeSmile, detectLiveness, loadModel } from '../utils/mlUtils';

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

    // Updated state for smile analysis
    const [smilePrediction, setSmilePrediction] = useState(null); // Stores { status, confidence, rawScore }
    const [analysisState, setAnalysisState] = useState('idle'); // 'idle', 'analyzing', 'success', 'error'

    const [livenessResult, setLivenessResult] = useState(null); // Keep for now, or adapt if implementing
    const cameraRef = useRef(null);

    // Request Camera Permission
    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasPermission(cameraStatus.status === 'granted');
            // Optionally, request media library permissions upfront too
            // await ImagePicker.requestMediaLibraryPermissionsAsync();

            // Attempt to load the ML model when the screen mounts
            try {
                console.log("QuestCompleteScreen: Attempting to pre-load ML model...");
                await loadModel(); // Pre-load the model
            } catch (e) {
                console.error("QuestCompleteScreen: Failed to pre-load ML model:", e);
                Alert.alert("ML Model Error", "Could not initialize the analysis model. Please try again later.");
            }
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
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelfieUri(result.assets[0].uri);
            triggerAnalysis(result.assets[0].uri);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                setSelfieUri(photo.uri);
                setShowCamera(false);
                triggerAnalysis(photo.uri);
            } catch (error) {
                console.error("Failed to take picture:", error);
                Alert.alert('Error', 'Could not take picture.');
                setShowCamera(false);
            }
        }
    };

    const triggerAnalysis = async (uri) => {
        console.log('Triggering ML analysis on:', uri);
        setAnalysisState('analyzing');
        setSmilePrediction(null); // Clear previous results
        // setLivenessResult('Analyzing Liveness...'); // Reset or handle as needed

        try {
            const smileData = await analyzeSmile(uri); // Expected: { status, confidence, rawScore }
            setSmilePrediction(smileData);
            setAnalysisState('success');

            // Placeholder for liveness if you integrate it fully
            // const livenessData = await detectLiveness(uri);
            // setLivenessResult(`Status: ${livenessData.status} (${(livenessData.score * 100).toFixed(0)}%)`);

        } catch (error) {
            console.error("ML Analysis Error in Screen:", error);
            setSmilePrediction(null); // Clear on error
            setAnalysisState('error');
            Alert.alert("Analysis Failed", "Could not analyze the selfie. Details: " + error.message);
        }
    };

    const handleFinish = async () => {
        // Optional: Save notes and results
        try {
            const questData = {
                notes,
                selfieUri,
                smilePrediction, // Save the structured prediction
                livenessResult, // Save if used
                completedAt: new Date().toISOString(),
            };
            const storageKey = `@questCompletion_${cityId}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(questData));
            console.log('Quest data saved for city:', cityId, questData);
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

    const isAnalyzing = analysisState === 'analyzing';
    const analysisFailed = analysisState === 'error';
    const analysisSucceeded = analysisState === 'success' && smilePrediction;

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

            {/* Display ML Results */}
            {selfieUri && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Selfie Analysis:</Text>
                    {isAnalyzing && <Text style={styles.resultText}>Analyzing your expression...</Text>}
                    {analysisFailed && <Text style={[styles.resultText, styles.errorText]}>Analysis failed. Please try another photo.</Text>}
                    {analysisSucceeded && (
                        <View>
                            <Text style={styles.resultText}>Emotion: {smilePrediction.status}</Text>
                            <Text style={styles.resultText}>Confidence: {(smilePrediction.confidence * 100).toFixed(1)}%</Text>
                            <Text style={styles.resultText}>Raw Score: {smilePrediction.rawScore.toFixed(4)} (0≈happy, 1≈sad)</Text>
                        </View>
                    )}
                    {/* Placeholder for Liveness - integrate similarly if needed */}
                    {/* {livenessResult && <Text style={styles.resultText}>Liveness Check: {livenessResult}</Text>} */}
                </View>
            )}

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
                            (isAnalyzing || !analysisSucceeded) && styles.buttonDisabled,
                            pressed && styles.buttonPressedFinish
                        ]}
                        onPress={handleFinish}
                        disabled={isAnalyzing || !analysisSucceeded}
                    >
                        <Text style={[styles.buttonText, (isAnalyzing || !analysisSucceeded) && styles.buttonTextDisabled]}>
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
    resultsContainer: {
        marginVertical: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 5,
        width: '90%',
        alignItems: 'center',
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    resultText: {
        fontSize: 14,
        marginTop: 3,
        textAlign: 'center',
        fontWeight: '500',
    },
    errorText: {
        color: COLORS.error,
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
});

export default QuestCompleteScreen; 