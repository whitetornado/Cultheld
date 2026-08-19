import { useEffect, useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { ProductConfig } from '../lib/types';
import { Lightbox } from './Lightbox';

interface MockupPreviewProps {
  mockupImageUrl: string;
  legendPngUrl: string;
  printArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    fitMode?: 'contain' | 'cover' | 'smart_fit';
    padding?: number;
    verticalBias?: number;
    maxFillPct?: number;
    minVisualSize?: number;
  };
  className?: string;
  onRender?: (dataUrl: string) => void;
  showPrintArea?: boolean;
  enableZoom?: boolean;
}

export const MockupPreview = ({
  mockupImageUrl,
  legendPngUrl,
  printArea,
  className = '',
  onRender,
  showPrintArea = false,
  enableZoom = true,
}: MockupPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string>('');

  useEffect(() => {
    renderMockup();
  }, [mockupImageUrl, legendPngUrl, printArea, showPrintArea]);

  const renderMockup = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError(null);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const mockupImg = new Image();
      const legendImg = new Image();

      mockupImg.crossOrigin = 'anonymous';
      legendImg.crossOrigin = 'anonymous';

      await Promise.all([
        new Promise((resolve, reject) => {
          mockupImg.onload = resolve;
          mockupImg.onerror = reject;
          mockupImg.src = mockupImageUrl;
        }),
        new Promise((resolve, reject) => {
          legendImg.onload = resolve;
          legendImg.onerror = reject;
          legendImg.src = legendPngUrl;
        }),
      ]);

      canvas.width = mockupImg.width;
      canvas.height = mockupImg.height;

      ctx.drawImage(mockupImg, 0, 0);

      const area = printArea || {
        x: 0.5,
        y: 0.37,
        width: 0.42,
        height: 0.56,
        fitMode: 'smart_fit' as const,
        padding: 0.05,
        verticalBias: 0.5,
      };

      const printBoxX = canvas.width * (area.x - area.width / 2);
      const printBoxY = canvas.height * (area.y - area.height / 2);
      const printBoxW = canvas.width * area.width;
      const printBoxH = canvas.height * area.height;

      const padding = area.padding || 0.05;
      const usableW = printBoxW * (1 - 2 * padding);
      const usableH = printBoxH * (1 - 2 * padding);

      const legendAspect = legendImg.width / legendImg.height;
      const boxAspect = usableW / usableH;

      let legendW: number, legendH: number;

      if (area.fitMode === 'cover') {
        if (legendAspect > boxAspect) {
          legendH = usableH;
          legendW = legendH * legendAspect;
        } else {
          legendW = usableW;
          legendH = legendW / legendAspect;
        }
      } else {
        if (legendAspect > boxAspect) {
          legendW = usableW;
          legendH = legendW / legendAspect;
        } else {
          legendH = usableH;
          legendW = legendH * legendAspect;
        }
      }

      const verticalBias = area.verticalBias || 0.5;
      const legendX = printBoxX + (printBoxW - legendW) / 2;
      const legendY = printBoxY + (printBoxH - legendH) * verticalBias;

      ctx.drawImage(legendImg, legendX, legendY, legendW, legendH);

      if (showPrintArea) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(printBoxX, printBoxY, printBoxW, printBoxH);
        ctx.setLineDash([]);

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          printBoxX + printBoxW * padding,
          printBoxY + printBoxH * padding,
          printBoxW * (1 - 2 * padding),
          printBoxH * (1 - 2 * padding)
        );
      }

      const dataUrl = canvas.toDataURL('image/png');
      setRenderedDataUrl(dataUrl);

      if (onRender) {
        onRender(dataUrl);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error rendering mockup:', err);
      setError('Fout bij laden van preview');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full w-auto h-auto ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          style={{ objectFit: 'contain' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {enableZoom && !isLoading && !error && renderedDataUrl && (
          <>
            <div
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all cursor-zoom-in"
              onClick={() => setShowLightbox(true)}
            />
            <button
              onClick={() => setShowLightbox(true)}
              className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
              style={{ zIndex: 10 }}
              aria-label="Zoom in"
            >
              <ZoomIn size={20} className="text-black" />
            </button>
          </>
        )}
      </div>

      {showLightbox && renderedDataUrl && (
        <Lightbox imageUrl={renderedDataUrl} onClose={() => setShowLightbox(false)} />
      )}
    </>
  );
};
