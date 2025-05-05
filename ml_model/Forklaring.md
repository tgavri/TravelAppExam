 ml_model/predict.py 
 this script will load the happy_sad_mobilenetv2.tflite model, take an image path from the command line, preprocess the image (resize and normalize pixels to the [-1, 1] range, matching the MobileNetV2 input requirements used during training), run inference, and print whether the image is predicted as "happy" or "sad".


 The train_model.py script is now updated to perform fine-tuning. It will:
Train the top layer for 25 epochs (with learning rate 1e-4).
Unfreeze the base MobileNetV2 layers starting from block 14.
Train for another 10 epochs with a much lower learning rate (1e-5).
Save the final model (which includes fine-tuning).
Convert the fine-tuned model to TFLite.
