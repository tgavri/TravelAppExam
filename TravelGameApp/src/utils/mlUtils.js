import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Placeholder ML utility functions
// Replace these with actual TFLite/ONNX model loading and inference

const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Constants for the model ---
const IMG_HEIGHT = 224;
const IMG_WIDTH = 224;

// Require the JSON to get its content directly
const modelJSON = require('../../assets/ml_models/tfjs_happy_sad_model/model.json');
// Require the binary assets to get their module IDs for Asset.fromModule
const MODEL_WEIGHTS_SHARD1_MODULE = require('../../assets/ml_models/tfjs_happy_sad_model/group1-shard1of3.bin');
const MODEL_WEIGHTS_SHARD2_MODULE = require('../../assets/ml_models/tfjs_happy_sad_model/group1-shard2of3.bin');
const MODEL_WEIGHTS_SHARD3_MODULE = require('../../assets/ml_models/tfjs_happy_sad_model/group1-shard3of3.bin');

const CLASS_NAMES = ['happy', 'sad'];
let model = null;

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    try {
        const binaryStr = atob(base64); // atob should be available globally in RN/Expo
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        console.error("Error decoding base64 string:", e);
        throw new Error("Failed to decode base64 weights. Input might be corrupted.");
    }
}

export const loadModel = async () => {
    if (model) {
        console.log("[mlUtils] Model already loaded.");
        return model;
    }
    try {
        console.log("[mlUtils] Initializing TensorFlow.js...");
        await tf.ready();
        console.log("[mlUtils] TensorFlow.js ready. Loading model: JSON required directly, weights via Asset/FileSystem...");

        // 1. Verify modelJSON was loaded by require()
        if (typeof modelJSON !== 'object' || modelJSON === null || !modelJSON.modelTopology || !modelJSON.weightsManifest) {
            console.error("[mlUtils] require(model.json) did not return a valid model JSON object. Got:", modelJSON);
            throw new Error("[mlUtils] Failed to load model JSON content via require.");
        }
        console.log("[mlUtils] model.json content loaded via require() successfully.");

        // 2. Get URIs for BINARY assets using Asset.fromModule
        console.log("[mlUtils] Resolving .bin asset modules...");
        const shard1Asset = Asset.fromModule(MODEL_WEIGHTS_SHARD1_MODULE);
        const shard2Asset = Asset.fromModule(MODEL_WEIGHTS_SHARD2_MODULE);
        const shard3Asset = Asset.fromModule(MODEL_WEIGHTS_SHARD3_MODULE);
        console.log("[mlUtils] .bin asset modules resolved.");

        // 3. Download assets if needed
        console.log("[mlUtils] Downloading .bin assets...");
        await Promise.all([
            shard1Asset.downloadAsync(),
            shard2Asset.downloadAsync(),
            shard3Asset.downloadAsync(),
        ]);
        console.log("[mlUtils] .bin assets downloaded.");

        // 4. Get local file URIs for .bin files
        const shard1Uri = shard1Asset.localUri;
        const shard2Uri = shard2Asset.localUri;
        const shard3Uri = shard3Asset.localUri;

        if (!shard1Uri || !shard2Uri || !shard3Uri) {
            console.error("Resolved bin URIs:", { shard1Uri, shard2Uri, shard3Uri });
            throw new Error("[mlUtils] Could not resolve local file URI for one or more .bin model assets.");
        }
        console.log("[mlUtils] .bin Asset URIs resolved:", { shard1Uri, shard2Uri, shard3Uri });

        // 5. Read weights as base64 and convert to ArrayBuffers
        console.log("[mlUtils] Reading weight shards as base64...");
        const [shard1Base64, shard2Base64, shard3Base64] = await Promise.all([
            FileSystem.readAsStringAsync(shard1Uri, { encoding: FileSystem.EncodingType.Base64 }),
            FileSystem.readAsStringAsync(shard2Uri, { encoding: FileSystem.EncodingType.Base64 }),
            FileSystem.readAsStringAsync(shard3Uri, { encoding: FileSystem.EncodingType.Base64 })
        ]);
        console.log("[mlUtils] Weight shards read.");

        // 6. Decode base64 and concatenate ArrayBuffers
        console.log("[mlUtils] Decoding base64 and concatenating weight buffers...");
        const weightDataShard1 = base64ToArrayBuffer(shard1Base64);
        const weightDataShard2 = base64ToArrayBuffer(shard2Base64);
        const weightDataShard3 = base64ToArrayBuffer(shard3Base64);

        const totalByteLength = weightDataShard1.byteLength + weightDataShard2.byteLength + weightDataShard3.byteLength;
        const combinedWeightsBuffer = new ArrayBuffer(totalByteLength);
        const combinedView = new Uint8Array(combinedWeightsBuffer);

        let offset = 0;
        combinedView.set(new Uint8Array(weightDataShard1), offset);
        offset += weightDataShard1.byteLength;
        combinedView.set(new Uint8Array(weightDataShard2), offset);
        offset += weightDataShard2.byteLength;
        combinedView.set(new Uint8Array(weightDataShard3), offset);
        console.log(`[mlUtils] Combined weights buffer created. Size: ${totalByteLength} bytes.`);

        // 7. Create custom IOHandler using the directly required modelJSON
        const customIOHandler = tf.io.fromMemory(
            modelJSON.modelTopology, // Use the object from require() directly
            modelJSON.weightsManifest[0].weights,
            combinedWeightsBuffer
        );

        // 8. Load model using the custom handler - USE loadGraphModel!
        console.log("[mlUtils] Loading model graph via fromMemory handler...");
        // model = await tf.loadLayersModel(customIOHandler); // Incorrect for this format
        model = await tf.loadGraphModel(customIOHandler); // Correct function for GraphModel format

        console.log("[mlUtils] >>> MODEL LOADED SUCCESSFULLY (Corrected Custom IOHandler with loadGraphModel) <<<");
        // Graph models don't have a .summary() method like Layers models
        // console.log("Model inputs:", model.inputs);
        // console.log("Model outputs:", model.outputs);

        return model;
    } catch (error) {
        console.error("[mlUtils] CRITICAL ERROR during model loading:", error);
        throw error;
    }
};

// Helper to preprocess image URI to tensor
async function imageToTensor(imageUri) {
    try {
        // console.log("Preprocessing image:", imageUri);
        const imgB64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
        const raw = new Uint8Array(imgBuffer);

        const decodedImage = decodeJpeg(raw);

        const processedTensor = tf.tidy(() => {
            const resized = tf.image.resizeBilinear(decodedImage, [IMG_HEIGHT, IMG_WIDTH]);
            const normalized = resized.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1.0));
            return normalized.expandDims(0);
        });

        decodedImage.dispose();
        // console.log("Image preprocessed successfully. Tensor shape:", processedTensor.shape);
        return processedTensor;

    } catch (error) {
        console.error("Error in imageToTensor:", error);
        throw error;
    }
}

export const analyzeSmile = async (imageUri) => {
    if (!model) {
        try {
            await loadModel();
        } catch (e) {
            console.error("Model loading failed during analysis attempt:", e);
            throw new Error("Model is not available for analysis.");
        }
    }
    if (!model) {
        throw new Error("Model could not be loaded for analysis.");
    }

    console.log('Analyzing smile for image URI:', imageUri);

    try {
        const imageTensor = await imageToTensor(imageUri);

        console.log("Running model prediction with actual model...");
        const predictionTensor = model.predict(imageTensor);

        const predictionData = await predictionTensor.data();
        const rawScore = predictionData[0];

        imageTensor.dispose();
        if (Array.isArray(predictionTensor)) {
            predictionTensor.forEach(t => t.dispose());
        } else {
            predictionTensor.dispose();
        }

        const predictedClassIndex = rawScore >= 0.5 ? 1 : 0;
        const status = CLASS_NAMES[predictedClassIndex];
        const confidence = (predictedClassIndex === 1) ? rawScore : (1 - rawScore);

        console.log("Actual Prediction Result:", { status, confidence: confidence, rawScore });
        return { status, confidence, rawScore };

    } catch (error) {
        console.error("Error during smile analysis (actual model predict or data processing):", error);
        throw error;
    }
};

export const detectLiveness = async (imageUri) => {
    console.log('Placeholder: Detecting liveness for image:', imageUri);
    await new Promise(resolve => setTimeout(resolve, 100));
    const score = Math.random() * 0.3 + 0.7;
    const status = score > 0.6 ? 'Real' : 'Spoof';
    return { score, status };
}; 