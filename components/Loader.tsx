
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center z-10 rounded-lg">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        <p className="mt-4 text-sm text-gray-300">Đang tạo với Gemini...</p>
      </div>
    </div>
  );
};
