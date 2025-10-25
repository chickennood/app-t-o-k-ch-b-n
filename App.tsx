
import React, { useState, useMemo, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { OutputDisplay } from './components/OutputDisplay';
import { Loader } from './components/Loader';
import { generateVideoPrompts, generateHookImage, editHookImage, generateVoiceoverAudio } from './services/geminiService';
import { type FormState, type GenerationResult } from './types';
import { DEFAULT_PERSONA_DNA, Platform, VOICE_TONES } from './constants';

// --- Audio Utility Functions ---
// Decodes a base64 string into a Uint8Array.
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// A function that takes raw PCM data and returns a Blob with a WAV header.
function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // file-size - 8
    writeString(8, 'WAVE');

    // "fmt " sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size for PCM
    view.setUint16(20, 1, true); // AudioFormat (1=PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    const blockAlign = numChannels * (bitsPerSample / 8);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size

    // Write PCM data
    const pcm = new Uint8Array(pcmData.buffer);
    for (let i = 0; i < pcm.length; i++) {
        view.setUint8(44 + i, pcm[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
}


function App() {
  const [formState, setFormState] = useState<FormState>({
    platform: Platform.Shorts,
    persona_dna: DEFAULT_PERSONA_DNA,
    topic: '3 mẹo quay shorts bằng điện thoại',
    duration_sec: 16,
    captionsEnabled: true,
    voiceTone: VOICE_TONES[0],
    emoji_enabled: true,
    emoji_style: 'normal',
    mascot_emoji: '🦡',
    extras: {},
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imageEditPrompt, setImageEditPrompt] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);

  const [audioResults, setAudioResults] = useState<(string | null)[]>([]);
  const [isAudioLoading, setIsAudioLoading] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<{ index: number; message: string } | null>(null);


  const isFormValid = useMemo(() => {
    return formState.persona_dna.trim() !== '' && formState.topic.trim() !== '' && formState.duration_sec >= 8;
  }, [formState]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImageResult(null);
    setImageError(null);
    setImageEditPrompt('');
    
    // Revoke any existing audio URLs before fetching new data
    audioResults.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setAudioResults([]);
    setAudioError(null);

    try {
      const generatedResult = await generateVideoPrompts(formState);
      setResult(generatedResult);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định. Vui lòng kiểm tra console.');
    } finally {
      setIsLoading(false);
    }
  }, [formState, isFormValid, audioResults]);

  const handleGenerateImage = useCallback(async () => {
    if (!result?.video_plans || result.video_plans.length === 0) return;
    setIsGeneratingImage(true);
    setImageError(null);
    setImageResult(null);
    setImageEditPrompt('');

    try {
      const firstVideoPlan = result.video_plans[0];
      const imageUrl = await generateHookImage(firstVideoPlan);
      setImageResult(imageUrl);
    } catch (err) {
      console.error(err);
      setImageError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo ảnh.');
    } finally {
      setIsGeneratingImage(false);
    }
  }, [result]);
  
  const handleEditImage = useCallback(async () => {
    if (!imageResult || !imageEditPrompt.trim()) return;
    setIsEditingImage(true);
    setImageError(null);

    try {
        const newImageUrl = await editHookImage(imageResult, imageEditPrompt);
        setImageResult(newImageUrl);
        setImageEditPrompt(''); // Clear prompt on success
    } catch (err) {
        console.error(err);
        setImageError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi chỉnh sửa ảnh.');
    } finally {
        setIsEditingImage(false);
    }
  }, [imageResult, imageEditPrompt]);

  const handleGenerateAudio = useCallback(async (segmentIndex: number) => {
    if (!result?.voiceover_scripts?.[segmentIndex]) return;

    setIsAudioLoading(segmentIndex);
    setAudioError(null);
    
    // Revoke previous URL for this segment if it exists
    if (audioResults[segmentIndex] && audioResults[segmentIndex]?.startsWith('blob:')) {
      URL.revokeObjectURL(audioResults[segmentIndex]!);
    }

    try {
      const script = result.voiceover_scripts[segmentIndex];
      const scriptText = script.voiceover_script.map(line => line.text).join(' ');
      const base64Audio = await generateVoiceoverAudio(scriptText);
      
      const pcmData = decodeBase64(base64Audio);
      // TTS API returns 24kHz, 1 channel, 16-bit PCM
      const wavBlob = pcmToWavBlob(pcmData, 24000, 1, 16); 
      const audioUrl = URL.createObjectURL(wavBlob);

      setAudioResults(prev => {
        const newResults = [...prev];
        newResults[segmentIndex] = audioUrl;
        return newResults;
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo âm thanh.';
      setAudioError({ index: segmentIndex, message });
    } finally {
      setIsAudioLoading(null);
    }
  }, [result, audioResults]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Trình tạo kịch bản Video
          </h1>
          <p className="text-sm text-gray-400 mt-1">Lên kế hoạch video đa khung hình bằng AI Gemini</p>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <InputForm 
              formState={formState} 
              setFormState={setFormState} 
              onSubmit={handleSubmit} 
              isLoading={isLoading} 
              isFormValid={isFormValid} 
            />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 relative min-h-[400px]">
            {isLoading && <Loader />}
            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-400">
                  <h3 className="font-bold text-lg">Tạo không thành công</h3>
                  <p className="mt-2 text-sm max-w-md mx-auto">{error}</p>
                </div>
              </div>
            )}
            {!isLoading && !error && result && (
              <OutputDisplay 
                result={result}
                onGenerateImage={handleGenerateImage}
                isGeneratingImage={isGeneratingImage}
                isEditingImage={isEditingImage}
                imageResult={imageResult}
                imageError={imageError}
                imageEditPrompt={imageEditPrompt}
                setImageEditPrompt={setImageEditPrompt}
                onEditImage={handleEditImage}
                onGenerateAudio={handleGenerateAudio}
                isAudioLoading={isAudioLoading}
                audioResults={audioResults}
                audioError={audioError}
              />
            )}
            {!isLoading && !error && !result && (
               <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <h3 className="font-semibold text-lg mt-4">Kịch bản được tạo sẽ xuất hiện ở đây</h3>
                  <p className="text-sm mt-1">Điền vào biểu mẫu và nhấp vào "Tạo" để bắt đầu.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="text-center py-4 text-xs text-gray-500 border-t border-gray-800">
        <p>Được xây dựng bởi một kỹ sư React frontend cao cấp với Gemini.</p>
      </footer>
    </div>
  );
}

export default App;
