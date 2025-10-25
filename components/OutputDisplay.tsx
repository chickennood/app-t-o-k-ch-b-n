
import React, { useState } from 'react';
import { type GenerationResult, type PublishingInfo, type VoiceoverScript } from '../types';

interface OutputDisplayProps {
  result: GenerationResult;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
  isEditingImage: boolean;
  imageResult: string | null;
  imageError: string | null;
  imageEditPrompt: string;
  setImageEditPrompt: (prompt: string) => void;
  onEditImage: () => void;
  onGenerateAudio: (segmentIndex: number) => void;
  isAudioLoading: number | null;
  audioResults: (string | null)[];
  audioError: { index: number; message: string } | null;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs font-semibold py-1 px-2 rounded-md transition-colors"
    >
      {copied ? 'Đã sao chép!' : 'Sao chép'}
    </button>
  );
};

const OutputBlock: React.FC<{ title: string; data: object }> = ({ title, data }) => {
  const jsonString = JSON.stringify(data, null, 2);
  return (
    <div className="relative">
      <h3 className="text-lg font-semibold text-purple-400 mb-3">{title}</h3>
      <CopyButton textToCopy={jsonString} />
      <pre className="bg-gray-900/50 rounded-md p-4 text-sm text-gray-200 overflow-x-auto scrollbar-thin">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
};

const VoiceoverBlock: React.FC<{
  title: string;
  data: VoiceoverScript;
  segmentIndex: number;
  onGenerateAudio: (segmentIndex: number) => void;
  isAudioLoading: boolean;
  audioResult: string | null;
  audioError: string | null;
}> = ({ title, data, segmentIndex, onGenerateAudio, isAudioLoading, audioResult, audioError }) => {
  const scriptText = data.voiceover_script.map(line => line.text).join('\n');

  return (
    <div className="relative">
      <h3 className="text-lg font-semibold text-purple-400 mb-3">{title}</h3>
      <CopyButton textToCopy={scriptText} />
      <div className="bg-gray-900/50 rounded-md p-4 text-sm text-gray-200 overflow-x-auto scrollbar-thin mb-4 space-y-2">
        {data.voiceover_script.length > 0 ? (
          data.voiceover_script.map((line, index) => (
            <div key={index} className="flex items-start">
              <span className="font-mono text-xs text-gray-500 w-12 flex-shrink-0 pt-0.5">{line.t.toFixed(1)}s</span>
              <p className="flex-1">{line.text}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Không có lời thoại cho phân đoạn này.</p>
        )}
      </div>

      <div className="mt-2">
        {audioResult ? (
          <audio controls src={audioResult} className="w-full">
            Trình duyệt của bạn không hỗ trợ phần tử âm thanh.
          </audio>
        ) : (
          <button
            onClick={() => onGenerateAudio(segmentIndex)}
            disabled={isAudioLoading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300"
          >
            {isAudioLoading ? 'Đang tạo âm thanh...' : '🎧 Tạo lời thoại'}
          </button>
        )}
      </div>
      
      {isAudioLoading && (
        <div className="flex items-center justify-center mt-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
            <p className="ml-3 text-xs text-gray-300">Gemini đang tạo âm thanh...</p>
        </div>
      )}

      {audioError && !isAudioLoading && (
        <div className="text-center text-red-400 text-sm p-2 mt-2 bg-red-900/20 rounded-md">
            <p className="font-bold">Tạo âm thanh thất bại</p>
            <p className="mt-1 text-xs">{audioError}</p>
        </div>
      )}
    </div>
  );
};


const ImageGenerationBlock: React.FC<{
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
  isEditingImage: boolean;
  imageResult: string | null;
  imageError: string | null;
  imageEditPrompt: string;
  setImageEditPrompt: (prompt: string) => void;
  onEditImage: () => void;
}> = ({ onGenerateImage, isGeneratingImage, isEditingImage, imageResult, imageError, imageEditPrompt, setImageEditPrompt, onEditImage }) => {
  const isBusy = isGeneratingImage || isEditingImage;
  
  return (
    <div className="mt-6 p-4 bg-gray-900/50 rounded-md border border-gray-700">
      <h4 className="text-md font-semibold text-green-400 mb-2">Ý tưởng hình ảnh cho Hook</h4>
      <p className="text-xs text-gray-400 mb-4">
        Tạo một ý tưởng hình ảnh cho cảnh hook của video để dùng làm thumbnail hoặc tham khảo sáng tạo.
      </p>
      
      {!imageResult && (
        <button
          onClick={onGenerateImage}
          disabled={isBusy}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-300"
        >
          {isGeneratingImage ? 'Đang tạo ảnh...' : '✨ Tạo hình ảnh Hook'}
        </button>
      )}

      {isGeneratingImage && !imageResult && (
        <div className="flex items-center justify-center h-48 bg-gray-800/50 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <p className="mt-3 text-xs text-gray-300">Gemini đang tạo hình ảnh của bạn...</p>
          </div>
        </div>
      )}

      {imageError && (
        <div className="text-center text-red-400 text-sm p-4 mt-2 bg-red-900/20 rounded-md">
          <p className="font-bold">Tạo ảnh thất bại</p>
          <p className="mt-1 text-xs">{imageError}</p>
        </div>
      )}

      {imageResult && (
        <div>
          <div className="relative">
            <img src={imageResult} alt="Generated Hook Visual" className="rounded-lg shadow-lg w-full" />
            {isBusy && (
                <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                    <p className="mt-3 text-sm text-gray-200">
                        {isEditingImage ? 'Đang áp dụng chỉnh sửa...' : 'Đang tạo ảnh mới...'}
                    </p>
                    </div>
                </div>
            )}
          </div>
          <button
            onClick={onGenerateImage}
            disabled={isBusy}
            className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-300"
          >
            {isGeneratingImage ? 'Đang tạo...' : '🔄 Tạo lại'}
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h5 className="text-sm font-semibold text-purple-400 mb-2">Chỉnh sửa ảnh</h5>
            <p className="text-xs text-gray-400 mb-3">Mô tả thay đổi bạn muốn áp dụng cho hình ảnh trên.</p>
            <textarea
              value={imageEditPrompt}
              onChange={(e) => setImageEditPrompt(e.target.value)}
              placeholder="VD: Thêm một chiếc mũ cao bồi cho nhân vật"
              className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none scrollbar-thin"
              rows={2}
              disabled={isBusy}
              aria-label="Image edit prompt"
            />
            <button
              onClick={onEditImage}
              disabled={isBusy || !imageEditPrompt.trim()}
              className="w-full mt-2 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-300"
            >
              {isEditingImage ? 'Đang chỉnh sửa...' : '🎨 Chỉnh sửa ảnh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PublishingOutputBlock: React.FC<{ info: PublishingInfo }> = ({ info }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-purple-400">Nội dung đăng tải</h3>
      
      <div className="relative">
        <label htmlFor="pub-title" className="block text-sm font-medium text-gray-300 mb-2">Tiêu đề</label>
        <CopyButton textToCopy={info.title} />
        <textarea
          id="pub-title"
          readOnly
          value={info.title}
          className="w-full bg-gray-900/50 rounded-md p-3 text-sm text-gray-200 scrollbar-thin resize-none border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          rows={2}
          aria-label="Generated Title"
        />
      </div>

      <div className="relative">
        <label htmlFor="pub-desc" className="block text-sm font-medium text-gray-300 mb-2">Mô tả</label>
        <CopyButton textToCopy={info.description} />
        <textarea
          id="pub-desc"
          readOnly
          value={info.description}
          className="w-full bg-gray-900/50 rounded-md p-3 text-sm text-gray-200 scrollbar-thin resize-none border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          rows={6}
          aria-label="Generated Description"
        />
      </div>

      <div className="relative">
        <label htmlFor="pub-tags" className="block text-sm font-medium text-gray-300 mb-2">Hashtags</label>
        <CopyButton textToCopy={info.hashtags} />
        <textarea
          id="pub-tags"
          readOnly
          value={info.hashtags}
          className="w-full bg-gray-900/50 rounded-md p-3 text-sm text-gray-200 scrollbar-thin resize-none border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          rows={2}
          aria-label="Generated Hashtags"
        />
      </div>
    </div>
  );
};


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ 
    result, 
    onGenerateImage, 
    isGeneratingImage,
    isEditingImage, 
    imageResult, 
    imageError,
    imageEditPrompt,
    setImageEditPrompt,
    onEditImage,
    onGenerateAudio,
    isAudioLoading,
    audioResults,
    audioError
}) => {
  const { video_plans, voiceover_scripts, publishingInfo } = result;
  const [activeSegment, setActiveSegment] = useState(0);

  return (
    <div className="flex flex-col h-full">
        {/* Tabs for Segments */}
        <div className="flex border-b border-gray-700 mb-4">
            {video_plans.map((_, index) => (
            <button
                key={index}
                onClick={() => setActiveSegment(index)}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                activeSegment === index
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
            >
                Phân đoạn {index + 1}
            </button>
            ))}
        </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin pr-2 space-y-8">
        {/* Content for active segment */}
        {video_plans[activeSegment] && voiceover_scripts[activeSegment] && (
            <div className='space-y-6'>
                <OutputBlock title={`Kế hoạch Video (Phân đoạn ${activeSegment + 1})`} data={video_plans[activeSegment]} />
                <VoiceoverBlock
                    title={`Kịch bản lồng tiếng (Phân đoạn ${activeSegment + 1})`}
                    data={voiceover_scripts[activeSegment]}
                    segmentIndex={activeSegment}
                    onGenerateAudio={onGenerateAudio}
                    isAudioLoading={isAudioLoading === activeSegment}
                    audioResult={audioResults[activeSegment] || null}
                    audioError={audioError?.index === activeSegment ? audioError.message : null}
                />
                {activeSegment === 0 && (
                     <ImageGenerationBlock 
                        onGenerateImage={onGenerateImage}
                        isGeneratingImage={isGeneratingImage}
                        isEditingImage={isEditingImage}
                        imageResult={imageResult}
                        imageError={imageError}
                        imageEditPrompt={imageEditPrompt}
                        setImageEditPrompt={setImageEditPrompt}
                        onEditImage={onEditImage}
                    />
                )}
            </div>
        )}
        
        {/* Publishing Prompt at the bottom */}
        <div className="pt-4">
            <PublishingOutputBlock info={publishingInfo} />
        </div>
      </div>
    </div>
  );
};
