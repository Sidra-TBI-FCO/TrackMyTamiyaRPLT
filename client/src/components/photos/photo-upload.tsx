import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PhotoUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
}

export default function PhotoUpload({ onUpload, maxFiles = 10, accept = "image/*" }: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxFiles,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    onUpload(selectedFiles);
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="font-mono text-gray-600 dark:text-gray-400">
          {isDragActive
            ? "Drop photos here..."
            : "Drag & drop photos here, or click to select"}
        </p>
        <p className="text-sm font-mono text-gray-500 mt-2">
          Up to {maxFiles} files
        </p>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            className="w-full bg-blue-600 hover:bg-blue-700 font-mono"
          >
            Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
