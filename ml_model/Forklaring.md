 ml_model/predict.py 
 this script will load the happy_sad_mobilenetv2.tflite model, take an image path from the command line, preprocess the image (resize and normalize pixels to the [-1, 1] range, matching the MobileNetV2 input requirements used during training), run inference, and print whether the image is predicted as "happy" or "sad".

Først uden finetuning, 
allerførst kun 10 epochs, så 25, nu 25 og finetuning.


HVad jeg også lærte:
That's great news! Seeing improvement after fine-tuning is a good sign. Yes, there are often more things we can try to potentially squeeze out better performance.
Looking at the training logs you provided for the fine-tuning phase (Epochs 26-35):
Apply to Forklaring.m...
5755
The validation accuracy only increased slightly during those 10 epochs of fine-tuning. This could mean a few things:
The model learned most of what it could from the current data with the current settings.
The fine-tuning learning rate (1e-5 or 0.00001) might have been too low, preventing the model from making significant enough adjustments.
There might still be an issue with the data itself (quality, balance).
Let's try two things:
Data Balance Check (Essential): I know I asked before, but could you please check the number of images in ml_model/sad_happy_dataset/data/happy and ml_model/sad_happy_dataset/data/sad? If one class has many more images than the other, it can really hinder the model's ability to learn the less represented class well. This is a very common cause of persistent bias in predictions.
Slightly Increase Fine-Tuning Learning Rate: Since the improvement was minimal during fine-tuning, let's try nudging the learning rate up slightly. Instead of 1e-5, let's try 5e-5 (0.00005). This might allow the model to make slightly larger adjustments during the fine-tuning phase without destabilizing the already learned weights too much.
I'll adjust the LEARNING_RATE_FINE_TUNE in ml_model/train_model.py.
Okay, the fine-tuning learning rate is adjusted.



 The train_model.py script is now updated to perform fine-tuning. It will:
Train the top layer for 25 epochs (with learning rate 1e-4).
Unfreeze the base MobileNetV2 layers starting from block 14.
Train for another 10 epochs with a much lower learning rate (1e-5).
Save the final model (which includes fine-tuning).
Convert the fine-tuned model to TFLite. 