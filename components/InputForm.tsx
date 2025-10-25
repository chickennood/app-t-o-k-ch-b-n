import React from 'react';
import { PLATFORM_CONFIG, Platform, VOICE_TONES } from '../constants';
import { type FormState } from '../types';
import { PlatformIcons } from './icons/PlatformIcons';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  isLoading: boolean;
  isFormValid: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">{children}</label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition scrollbar-thin" />
);

export const InputForm: React.FC<InputFormProps> = ({ formState, setFormState, onSubmit, isLoading, isFormValid }) => {
  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, platform: e.target.value as Platform }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, duration_sec: parseInt(e.target.value, 10) || 0 }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleExtrasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, extras: { ...prev.extras, [name]: value } }));
  };
  
  const selectedPlatformConfig = PLATFORM_CONFIG[formState.platform];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
      <div>
        <Label htmlFor="platform">Nền tảng</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             {PlatformIcons[formState.platform]({className: "h-5 w-5 text-gray-400"})}
          </div>
          <select
            id="platform"
            name="platform"
            value={formState.platform}
            onChange={handlePlatformChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 pl-10 pr-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
          >
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="topic">Chủ đề</Label>
        <TextInput 
          id="topic" 
          name="topic" 
          type="text"
          value={formState.topic} 
          onChange={handleTextChange}
          placeholder="VD: Cách làm cà phê cold brew" 
        />
      </div>

      <div>
        <Label htmlFor="persona_dna">ADN nhân vật</Label>
        <TextArea
          id="persona_dna"
          name="persona_dna"
          rows={4}
          value={formState.persona_dna}
          onChange={handleTextChange}
          placeholder="Mô tả giọng nói, phong cách và tính cách"
        />
      </div>

      <div>
        <Label htmlFor="voiceTone">Tông giọng</Label>
        <select
          id="voiceTone"
          name="voiceTone"
          value={formState.voiceTone}
          onChange={handleTextChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
        >
          {VOICE_TONES.map(tone => (
            <option key={tone} value={tone}>{tone}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Tông giọng này sẽ được áp dụng cho tất cả các phân cảnh.</p>
      </div>

      <div>
        <Label htmlFor="duration_sec">Thời lượng (giây)</Label>
        <TextInput 
          id="duration_sec" 
          name="duration_sec" 
          type="number" 
          value={formState.duration_sec}
          onChange={handleNumberChange}
          min="8"
          placeholder="VD: 30"
        />
        <p className="text-xs text-gray-400 mt-1">Tối thiểu: {selectedPlatformConfig.minSec}s, Tối đa: {selectedPlatformConfig.maxSec}s. Sẽ được làm tròn đến 8s gần nhất.</p>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center">
            <input
                id="captionsEnabled"
                name="captionsEnabled"
                type="checkbox"
                checked={formState.captionsEnabled}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-600"
                aria-describedby="captions-description"
            />
            <div className="ml-3">
                <label htmlFor="captionsEnabled" className="text-sm font-medium text-gray-300">
                    Bật phụ đề
                </label>
                <p id="captions-description" className="text-xs text-gray-400">
                    Tạo văn bản trên màn hình cho phụ đề và lớp phủ.
                </p>
            </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6 space-y-4">
        <div className="flex items-center">
          <input
            id="emoji_enabled"
            name="emoji_enabled"
            type="checkbox"
            checked={formState.emoji_enabled}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-600"
            aria-describedby="emoji-description"
          />
          <div className="ml-3">
            <label htmlFor="emoji_enabled" className="text-sm font-medium text-gray-300">
              Bật Emoji & Mascot
            </label>
            <p id="emoji-description" className="text-xs text-gray-400">
              Thêm emoji vào nội dung đăng để tăng tương tác.
            </p>
          </div>
        </div>

        {formState.emoji_enabled && (
          <div className="pl-7 space-y-4 mt-4">
            <div>
              <Label htmlFor="emoji_style">Kiểu Emoji</Label>
              <select
                id="emoji_style"
                name="emoji_style"
                value={formState.emoji_style}
                onChange={handleTextChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
              >
                <option value="minimal">Tối thiểu (Tinh tế)</option>
                <option value="normal">Bình thường (Cân bằng)</option>
                <option value="extra">Nhiều (Tương tác cao)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="mascot_emoji">Emoji Mascot</Label>
              <TextInput
                id="mascot_emoji"
                name="mascot_emoji"
                type="text"
                value={formState.mascot_emoji}
                onChange={handleTextChange}
                placeholder="VD: 🦡"
              />
            </div>
          </div>
        )}
      </div>


      {formState.platform === Platform.Shopee && (
        <div className="border-t border-gray-700 pt-6 space-y-4">
            <h3 className="text-md font-semibold text-purple-400">Thông tin thêm cho Shopee</h3>
            <div>
              <Label htmlFor="productId">ID Sản phẩm</Label>
              <TextInput id="productId" name="productId" type="text" value={formState.extras.productId || ''} onChange={handleExtrasChange} />
            </div>
            <div>
              <Label htmlFor="price">Giá</Label>
              <TextInput id="price" name="price" type="text" value={formState.extras.price || ''} onChange={handleExtrasChange} />
            </div>
            <div>
              <Label htmlFor="voucher">Mã giảm giá</Label>
              <TextInput id="voucher" name="voucher" type="text" value={formState.extras.voucher || ''} onChange={handleExtrasChange} />
            </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300"
        >
          {isLoading ? 'Đang tạo...' : 'Tạo'}
        </button>
      </div>
    </form>
  );
};