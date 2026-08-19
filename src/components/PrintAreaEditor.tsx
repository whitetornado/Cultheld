import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, ZoomIn, ZoomOut } from 'lucide-react';

interface PrintAreaEditorProps {
  mockupImageUrl: string;
  testLegendUrl?: string;
  printArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  padding: number;
  fitMode: 'contain' | 'cover' | 'smart_fit';
  verticalBias: number;
  onPrintAreaChange: (area: { x: number; y: number; width: number; height: number }) => void;
  onPaddingChange: (padding: number) => void;
  onFitModeChange: (mode: 'contain' | 'cover' | 'smart_fit') => void;
  onVerticalBiasChange: (bias: number) => void;
}

export const PrintAreaEditor = ({
  mockupImageUrl,
  testLegendUrl,
  printArea,
  padding,
  fitMode,
  verticalBias,
  onPrintAreaChange,
  onPaddingChange,
  onFitModeChange,
  onVerticalBiasChange,
}: PrintAreaEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mockupImg, setMockupImg] = useState<HTMLImageElement | null>(null);
  const [legendImg, setLegendImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    loadImages();
  }, [mockupImageUrl, testLegendUrl]);

  useEffect(() => {
    renderEditor();
  }, [mockupImg, legendImg, printArea, padding, fitMode, verticalBias]);

  const loadImages = async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = mockupImageUrl;
    });
    setMockupImg(img);

    if (testLegendUrl) {
      const legImg = new Image();
      legImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        legImg.onload = resolve;
        legImg.src = testLegendUrl;
      });
      setLegendImg(legImg);
    }
  };

  const renderEditor = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mockupImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = mockupImg.width;
    canvas.height = mockupImg.height;

    ctx.drawImage(mockupImg, 0, 0);

    const printBoxX = canvas.width * (printArea.x - printArea.width / 2);
    const printBoxY = canvas.height * (printArea.y - printArea.height / 2);
    const printBoxW = canvas.width * printArea.width;
    const printBoxH = canvas.height * printArea.height;

    if (legendImg) {
      const usableW = printBoxW * (1 - 2 * padding);
      const usableH = printBoxH * (1 - 2 * padding);

      const legendAspect = legendImg.width / legendImg.height;
      const boxAspect = usableW / usableH;

      let legendW: number, legendH: number;

      if (fitMode === 'cover') {
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

      const legendX = printBoxX + (printBoxW - legendW) / 2;
      const legendY = printBoxY + (printBoxH - legendH) * verticalBias;

      ctx.globalAlpha = 0.9;
      ctx.drawImage(legendImg, legendX, legendY, legendW, legendH);
      ctx.globalAlpha = 1.0;
    }

    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 4;
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

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(printBoxX + printBoxW - 10, printBoxY + printBoxH - 10, 20, 20);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const printBoxX = canvas.width * (printArea.x - printArea.width / 2);
    const printBoxY = canvas.height * (printArea.y - printArea.height / 2);
    const printBoxW = canvas.width * printArea.width;
    const printBoxH = canvas.height * printArea.height;

    const resizeHandleSize = 20;
    if (
      x >= printBoxX + printBoxW - resizeHandleSize &&
      x <= printBoxX + printBoxW + resizeHandleSize &&
      y >= printBoxY + printBoxH - resizeHandleSize &&
      y <= printBoxY + printBoxH + resizeHandleSize
    ) {
      setIsResizing(true);
      setDragStart({ x, y });
    } else if (
      x >= printBoxX &&
      x <= printBoxX + printBoxW &&
      y >= printBoxY &&
      y <= printBoxY + printBoxH
    ) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || (!isDragging && !isResizing)) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDragging) {
      const deltaX = (x - dragStart.x) / canvas.width;
      const deltaY = (y - dragStart.y) / canvas.height;

      onPrintAreaChange({
        ...printArea,
        x: Math.max(printArea.width / 2, Math.min(1 - printArea.width / 2, printArea.x + deltaX)),
        y: Math.max(printArea.height / 2, Math.min(1 - printArea.height / 2, printArea.y + deltaY)),
      });

      setDragStart({ x, y });
    } else if (isResizing) {
      const deltaX = (x - dragStart.x) / canvas.width;
      const deltaY = (y - dragStart.y) / canvas.height;

      const aspectRatio = printArea.width / printArea.height;
      const avgDelta = (deltaX + deltaY) / 2;

      const newWidth = Math.max(0.1, Math.min(0.8, printArea.width + avgDelta));
      const newHeight = newWidth / aspectRatio;

      if (newHeight > 0.8 || newHeight < 0.1) {
        const constrainedHeight = Math.max(0.1, Math.min(0.8, newHeight));
        const constrainedWidth = constrainedHeight * aspectRatio;

        onPrintAreaChange({
          ...printArea,
          width: constrainedWidth,
          height: constrainedHeight,
        });
      } else {
        onPrintAreaChange({
          ...printArea,
          width: newWidth,
          height: newHeight,
        });
      }

      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            title="Uitzoomen"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-semibold min-w-[60px] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            title="Inzoomen"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.0)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-gray-100"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ maxHeight: '600px' }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-move"
          style={{
            width: `${zoom * 100}%`,
            height: 'auto',
            display: 'block'
          }}
          onMouseDown={handleMouseDown}
        />
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-xs space-y-1">
          <div>Rood: Print Area</div>
          <div>Groen: Bruikbaar (na padding)</div>
          <div>Sleep om te verplaatsen</div>
          <div>Sleep rechtsonder om grootte te wijzigen</div>
          <div className="pt-1 border-t border-white border-opacity-30">
            Aspect ratio: {(printArea.width / printArea.height).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Fit Mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onFitModeChange('contain')}
              className={`flex-1 px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
                fitMode === 'contain'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              Contain
            </button>
            <button
              type="button"
              onClick={() => onFitModeChange('cover')}
              className={`flex-1 px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
                fitMode === 'cover'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              Cover
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Padding: {(padding * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.01"
            value={padding}
            onChange={(e) => onPaddingChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Verticale Positie: {(verticalBias * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={verticalBias}
            onChange={(e) => onVerticalBiasChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Snelle aanpassingen</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const aspectRatio = printArea.width / printArea.height;
                const newWidth = Math.max(0.1, printArea.width - 0.05);
                const newHeight = newWidth / aspectRatio;
                onPrintAreaChange({ ...printArea, width: newWidth, height: newHeight });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-100"
              title="Kleiner (in verhouding)"
            >
              <Minus size={16} className="mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => {
                const aspectRatio = printArea.width / printArea.height;
                const newWidth = Math.min(0.8, printArea.width + 0.05);
                const newHeight = newWidth / aspectRatio;
                onPrintAreaChange({ ...printArea, width: newWidth, height: newHeight });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-100"
              title="Groter (in verhouding)"
            >
              <Plus size={16} className="mx-auto" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs bg-gray-50 p-3 rounded">
        <div>
          <div className="font-semibold">X</div>
          <div>{(printArea.x * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="font-semibold">Y</div>
          <div>{(printArea.y * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="font-semibold">Width</div>
          <div>{(printArea.width * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="font-semibold">Height</div>
          <div>{(printArea.height * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};
