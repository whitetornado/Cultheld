import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  accept?: string;
  helpText?: string;
}

export const ImageUpload = ({
  label,
  currentImageUrl,
  onImageChange,
  accept = 'image/png,image/jpeg,image/jpg,image/webp',
  helpText,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      onImageChange(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-48 h-48 object-contain border-2 border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors bg-gray-50"
        >
          <Upload size={32} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">Klik om te uploaden</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {helpText && <p className="text-sm text-gray-500 mt-2">{helpText}</p>}
    </div>
  );
};
