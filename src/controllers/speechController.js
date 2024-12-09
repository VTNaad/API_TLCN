// const fs = require('fs');
// const DeepSpeech = require('deepspeech');
// const ffmpeg = require('fluent-ffmpeg');
// const path = require('path');

// // Load the DeepSpeech model
// const modelPath = path.join(__dirname, '..', 'models', 'deepspeech-0.9.3-models.pbmm');
// const scorerPath = path.join(__dirname, '..', 'models', 'deepspeech-0.9.3-models.scorer');

// const model = new DeepSpeech.Model(modelPath);
// model.enableExternalScorer(scorerPath);

// // Convert audio to WAV format (DeepSpeech only supports WAV)
// const convertAudioToWav = (filePath) => {
//   return new Promise((resolve, reject) => {
//     const outputFile = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.wav');
//     ffmpeg(filePath)
//       .output(outputFile)
//       .on('end', () => resolve(outputFile))
//       .on('error', (err) => reject(err))
//       .run();
//   });
// };

// // Resample audio to 16 kHz (DeepSpeech needs this sample rate)
// const resampleAudioTo16kHz = (inputFile) => {
//   return new Promise((resolve, reject) => {
//     const outputFile = path.join(path.dirname(inputFile), 'resampled_16kHz.wav');
//     ffmpeg(inputFile)
//       .audioFrequency(16000)  // Resample to 16 kHz
//       .audioChannels(1)       // Ensure mono audio
//       .toFormat('wav')        // Output format should be WAV
//       .on('end', () => resolve(outputFile))
//       .on('error', (err) => reject(err))
//       .save(outputFile);
//   });
// };

// // Speech recognition and comparison
// const processSpeech = async (req, res) => {
//   try {
//     const audioFile = req.file.path; // The uploaded audio file
//     const targetWord = req.body.word; // The target word for comparison (e.g., "Hello")

//     // Convert the audio to WAV format
//     const wavFile = await convertAudioToWav(audioFile);

//     // Resample the audio to 16 kHz
//     const resampledFile = await resampleAudioTo16kHz(wavFile);

//     // Read the resampled audio file
//     const buffer = fs.readFileSync(resampledFile);
//     const audioStream = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

//     // Run the DeepSpeech model to get the transcription
//     const result = model.stt(audioStream);
//     console.log(result)

//     // Compare the recognized result with the target word
//     const normalizedResult = result.toLowerCase().trim();
//     const normalizedTarget = targetWord.toLowerCase().trim();
//     const isMatch = normalizedResult === normalizedTarget;
//     const accuracy = isMatch ? 100 : 0; // If it matches exactly, it's 100%

//     res.json({
//       success: true,
//       recognized: result,
//       accuracy,
//     });

//     // Clean up the temporary files
//     fs.unlinkSync(audioFile);
//     fs.unlinkSync(wavFile);
//     fs.unlinkSync(resampledFile);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error processing speech' });
//   }
// };

// module.exports = { processSpeech };

const fs = require('fs');
const DeepSpeech = require('deepspeech');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const leven = require('leven');

// Load the DeepSpeech model
const modelPath = path.join(__dirname, '..', 'models', 'deepspeech-0.9.3-models.pbmm');
const scorerPath = path.join(__dirname, '..', 'models', 'deepspeech-0.9.3-models.scorer');

const model = new DeepSpeech.Model(modelPath);
model.enableExternalScorer(scorerPath);

// Convert audio to WAV format (DeepSpeech only supports WAV)
const convertAudioToWav = (filePath) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.wav');
    ffmpeg(filePath)
      .output(outputFile)
      .on('end', () => resolve(outputFile))
      .on('error', (err) => reject(err))
      .run();
  });
};

// Resample audio to 16 kHz (DeepSpeech needs this sample rate)
const resampleAudioTo16kHz = (inputFile) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(path.dirname(inputFile), 'resampled_16kHz.wav');
    ffmpeg(inputFile)
      .audioFrequency(16000)  // Resample to 16 kHz
      .audioChannels(1)       // Ensure mono audio
      .toFormat('wav')        // Output format should be WAV
      .on('end', () => resolve(outputFile))
      .on('error', (err) => reject(err))
      .save(outputFile);
  });
};

// Speech recognition and comparison
const processSpeech = async (req, res) => {
  try {
    const audioFile = req.file.path; // The uploaded audio file
    const targetWord = req.body.word; // The target word for comparison (e.g., "Hello")

    // Convert the audio to WAV format
    const wavFile = await convertAudioToWav(audioFile);

    // Resample the audio to 16 kHz
    const resampledFile = await resampleAudioTo16kHz(wavFile);

    // Read the resampled audio file
    const buffer = fs.readFileSync(resampledFile);
    const audioStream = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

    // Run the DeepSpeech model to get the transcription
    const result = model.stt(audioStream);
    console.log(result);

    // Normalize the recognized result and target word
    const normalizedResult = result.toLowerCase().trim();
    const normalizedTarget = targetWord.toLowerCase().trim();

    // Calculate Levenshtein distance
    const levenshteinDistance = leven(normalizedResult, normalizedTarget);

    // Calculate accuracy as a percentage
    const maxLen = Math.max(normalizedResult.length, normalizedTarget.length);
    const accuracy = maxLen > 0 ? ((maxLen - levenshteinDistance) / maxLen) * 100 : 0;

    res.json({
      success: true,
      recognized: result,
      accuracy: accuracy.toFixed(2), // Format accuracy to two decimal places
    });

    // Clean up the temporary files
    fs.unlinkSync(audioFile);
    fs.unlinkSync(wavFile);
    fs.unlinkSync(resampledFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error processing speech' });
  }
};

module.exports = { processSpeech };
