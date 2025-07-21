import { useState } from "react";
import { ImageIcon, AlertCircle } from "lucide-react";

interface ImageFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export default function ImageFallback({ src, alt, className = "", fallbackText }: ImageFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}>
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">
          {fallbackText || "Image not available in this environment"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
          <ImageIcon className="h-8 w-8 text-gray-400 animate-pulse" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}