import { ChangeEvent, useRef, useState } from "react";
import { Button } from "./button";
import { Camera, X } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (file: File) => Promise<string | void>;
  previewUrl?: string;
  className?: string;
  buttonText?: string;
}

export function ImageUploader({
  onImageUpload,
  previewUrl,
  className = "",
  buttonText = "Upload Image",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Send to parent component for upload
      await onImageUpload(file);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error handling file upload:", error);
      // Revert preview on error
      setPreview(previewUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Camera className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{buttonText}</p>
          <p className="text-xs text-gray-400 mt-1">Click to select an image</p>
        </div>
      )}

      {isUploading && (
        <div className="mt-2 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
          <span className="text-sm">Uploading...</span>
        </div>
      )}
    </div>
  );
}
