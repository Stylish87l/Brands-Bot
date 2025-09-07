import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageInputProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const ImageInput: React.FC<ImageInputProps> = ({ label, file, onFileChange }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (file) {
      // Create a new FileReader each time to avoid issues with stale readers
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    onFileChange(newFile || null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [onFileChange]);

  return (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
        />
        <div
            onClick={handleClick}
            className="mt-1 flex justify-center items-center w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-400 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors"
        >
            {previewUrl ? (
            <div className="relative h-full">
                <img src={previewUrl} alt="Preview" className="h-full object-contain" />
                 <button 
                    onClick={handleClear} 
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                    aria-label="Remove image"
                 >
                    &times;
                 </button>
            </div>
            ) : (
            <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500 dark:text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
            </div>
            )}
        </div>
    </div>
  );
};

export default ImageInput;