import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface LegendOnShirtPreviewProps {
  shirtImageUrl: string;
  legendImageUrl: string;
  blendMode?: string;
  shirtColor?: string;
  className?: string;
  printAreaX?: number;
  printAreaY?: number;
  printAreaWidth?: number;
  printAreaHeight?: number;
  fitMode?: 'contain' | 'cover' | 'smart_fit';
  paddingPercent?: number;
}

export const LegendOnShirtPreview = ({
  shirtImageUrl,
  legendImageUrl,
  blendMode = 'multiply',
  shirtColor = '#FFFFFF',
  className = '',
  printAreaX = 0.5,
  printAreaY = 0.37,
  printAreaWidth = 0.42,
  printAreaHeight = 0.56,
  fitMode = 'smart_fit',
  paddingPercent = 0.05,
}: LegendOnShirtPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setLoading(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const shirtImg = new Image();
    const legendImg = new Image();
    let loadedImages = 0;
    let hasError = false;

    const drawComposite = () => {
      if (hasError) return;

      loadedImages++;
      if (loadedImages < 2) return;

      if (shirtImg.width === 0 || shirtImg.height === 0) {
        setError('Shirt afbeelding is ongeldig');
        setLoading(false);
        return;
      }

      canvas.width = shirtImg.width;
      canvas.height = shirtImg.height;

      ctx.fillStyle = shirtColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(shirtImg, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

      const printWidth = canvas.width * printAreaWidth;
      const printHeight = canvas.height * printAreaHeight;
      const printX = canvas.width * printAreaX - printWidth / 2;
      const printY = canvas.height * printAreaY - printHeight / 2;

      const padding = Math.min(printWidth, printHeight) * paddingPercent;
      const availableWidth = printWidth - padding * 2;
      const availableHeight = printHeight - padding * 2;

      const legendAspect = legendImg.width / legendImg.height;
      const areaAspect = availableWidth / availableHeight;

      let legendWidth: number;
      let legendHeight: number;

      if (fitMode === 'smart_fit' || fitMode === 'contain') {
        if (legendAspect > areaAspect) {
          legendWidth = availableWidth;
          legendHeight = legendWidth / legendAspect;
        } else {
          legendHeight = availableHeight;
          legendWidth = legendHeight * legendAspect;
        }
      } else {
        if (legendAspect < areaAspect) {
          legendWidth = availableWidth;
          legendHeight = legendWidth / legendAspect;
        } else {
          legendHeight = availableHeight;
          legendWidth = legendHeight * legendAspect;
        }
      }

      const x = printX + (printWidth - legendWidth) / 2;
      const y = printY + (printHeight - legendHeight) / 2;

      ctx.drawImage(legendImg, x, y, legendWidth, legendHeight);

      ctx.restore();
      setLoading(false);
    };

    shirtImg.crossOrigin = 'anonymous';
    legendImg.crossOrigin = 'anonymous';

    shirtImg.onload = drawComposite;
    legendImg.onload = drawComposite;

    shirtImg.onerror = () => {
      hasError = true;
      setError('Shirt afbeelding kon niet geladen worden');
      setLoading(false);
    };
    legendImg.onerror = () => {
      hasError = true;
      setError('Legend afbeelding kon niet geladen worden');
      setLoading(false);
    };

    shirtImg.src = shirtImageUrl;
    legendImg.src = legendImageUrl;
  }, [shirtImageUrl, legendImageUrl, blendMode, shirtColor, printAreaX, printAreaY, printAreaWidth, printAreaHeight, fitMode, paddingPercent]);

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 p-6">
          <AlertCircle size={48} className="mb-3" />
          <p className="text-sm font-medium text-center">{error}</p>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Controleer of de afbeelding bestaat en correct is
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-sm text-gray-500">Laden...</div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-lg" />
    </div>
  );
};
