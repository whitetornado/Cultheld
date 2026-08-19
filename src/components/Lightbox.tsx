import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
}

export const Lightbox = ({ imageUrl, onClose }: LightboxProps) => {
  const isMobile = window.innerWidth < 768;
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    const hintTimer = setTimeout(() => {
      setShowHint(false);
    }, isMobile ? 3000 : 4000);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
      clearTimeout(hintTimer);
    };
  }, [onClose, isMobile]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const minScale = 1;

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, minScale);
      if (newScale === minScale) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > minScale) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > minScale) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > minScale) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && scale > minScale) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center transition-opacity cursor-pointer"
      style={{
        zIndex: 99999,
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onClose();
        }
      }}
    >
      {!isMobile && showHint && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium z-40 shadow-lg animate-pulse">
          Klik buiten de afbeelding of druk op ESC om te sluiten
        </div>
      )}

      {isMobile ? (
        <>
          <button
            onClick={onClose}
            className="fixed top-6 right-6 bg-white rounded-full hover:bg-red-500 active:bg-red-500 active:scale-95 transition-all duration-200 shadow-2xl z-50 group p-4"
            aria-label="Sluiten"
          >
            <X size={32} className="text-black group-hover:text-white group-active:text-white" />
          </button>

          <div className="fixed top-6 left-6 flex gap-3 z-50">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="bg-white rounded-full hover:bg-blue-500 active:bg-blue-500 active:scale-95 transition-all duration-200 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:bg-white disabled:active:scale-100 group p-3"
              aria-label="Inzoomen"
            >
              <ZoomIn size={28} className="text-black group-hover:text-white group-active:text-white" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={scale <= minScale}
              className="bg-white rounded-full hover:bg-blue-500 active:bg-blue-500 active:scale-95 transition-all duration-200 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:bg-white disabled:active:scale-100 group p-3"
              aria-label="Uitzoomen"
            >
              <ZoomOut size={28} className="text-black group-hover:text-white group-active:text-white" />
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 bg-white rounded-full hover:bg-red-500 hover:scale-110 transition-all duration-200 z-[10000] group p-5"
            style={{
              boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.3), 0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
            aria-label="Sluiten"
          >
            <X size={36} className="text-black group-hover:text-white" strokeWidth={2.5} />
          </button>

          <div className="absolute top-6 left-6 flex gap-4 z-[10000]">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="bg-white rounded-full hover:bg-blue-500 hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:scale-100 group p-4"
              style={{
                boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.3), 0 20px 50px rgba(0, 0, 0, 0.5)',
              }}
              aria-label="Inzoomen"
            >
              <ZoomIn size={32} className="text-black group-hover:text-white" strokeWidth={2.5} />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={scale <= minScale}
              className="bg-white rounded-full hover:bg-blue-500 hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:scale-100 group p-4"
              style={{
                boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.3), 0 20px 50px rgba(0, 0, 0, 0.5)',
              }}
              aria-label="Uitzoomen"
            >
              <ZoomOut size={32} className="text-black group-hover:text-white" strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}

      <div
        className={`relative overflow-hidden flex items-center justify-center cursor-auto ${
          isMobile ? 'w-full h-full px-4 py-20' : 'w-full h-full px-8 py-16'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Zoom preview"
          className="w-full h-full object-contain transition-transform select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > minScale ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            touchAction: 'none',
            transformOrigin: 'center center',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
          draggable={false}
        />
      </div>

      {scale > minScale && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium shadow-lg">
          {Math.round(scale * 100)}% - Sleep om te bewegen
        </div>
      )}
    </div>,
    document.body
  );
};

interface ZoomableMockupProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

export const ZoomableMockup = ({ imageUrl, alt, className = '' }: ZoomableMockupProps) => {
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <div
        className={`relative cursor-zoom-in group ${className}`}
        onClick={() => setShowLightbox(true)}
      >
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
          <ZoomIn
            size={32}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      {showLightbox && (
        <Lightbox imageUrl={imageUrl} onClose={() => setShowLightbox(false)} />
      )}
    </>
  );
};
