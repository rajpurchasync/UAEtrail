import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Dialog } from './Dialog';

export type PhotoShape = 'circle' | 'rectangle';

interface PhotoEditorResult {
  blob: Blob;
  width: number;
  height: number;
  shape: PhotoShape;
}

interface PhotoEditorDialogProps {
  open: boolean;
  file: File | null;
  title: string;
  onClose: () => void;
  onApply: (result: PhotoEditorResult) => Promise<void> | void;
  applying?: boolean;
  shape: PhotoShape;
  outputWidth?: number;
  outputHeight?: number;
}

interface Point {
  x: number;
  y: number;
}

const PREVIEW_MAX = 248;
const MAX_INPUT_SIZE = 10 * 1024 * 1024;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const readImageSize = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read the selected image.'));
    img.src = src;
  });

const exportEditedPhoto = async (params: {
  src: string;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  outputWidth: number;
  outputHeight: number;
  zoom: number;
  rotationDeg: number;
  offset: Point;
  shape: PhotoShape;
}): Promise<Blob> => {
  const {
    src,
    imageWidth,
    imageHeight,
    frameWidth,
    frameHeight,
    outputWidth,
    outputHeight,
    zoom,
    rotationDeg,
    offset,
    shape,
  } = params;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not process this image.'));
    img.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize image processing.');
  }

  const coverScale = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const ratio = outputWidth / frameWidth;
  const drawScale = coverScale * zoom * ratio;

  if (shape === 'rectangle') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  if (shape === 'circle') {
    const radius = Math.min(outputWidth, outputHeight) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(outputWidth / 2, outputHeight / 2, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.save();
  ctx.translate(outputWidth / 2 + offset.x * ratio, outputHeight / 2 + offset.y * ratio);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.scale(drawScale, drawScale);
  ctx.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  ctx.restore();

  if (shape === 'circle') {
    ctx.restore();
  }

  const webp = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.86);
  });
  if (webp) return webp;

  const fallbackType = shape === 'circle' ? 'image/png' : 'image/jpeg';
  const fallbackQuality = fallbackType === 'image/jpeg' ? 0.88 : undefined;
  const fallback = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), fallbackType, fallbackQuality);
  });
  if (!fallback) {
    throw new Error('Could not export processed image.');
  }
  return fallback;
};

export const PhotoEditorDialog = ({
  open,
  file,
  title,
  onClose,
  onApply,
  applying = false,
  shape,
  outputWidth: outputWidthProp,
  outputHeight: outputHeightProp,
}: PhotoEditorDialogProps) => {
  const outputWidth = outputWidthProp ?? (shape === 'circle' ? 512 : 1600);
  const outputHeight = outputHeightProp ?? (shape === 'circle' ? 512 : 1200);

  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const dragState = useRef<{ active: boolean; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open || !file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_INPUT_SIZE) {
      setError('Image is too large. Maximum size is 10 MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setError(null);
    setZoom(1);
    setRotationDeg(0);
    setOffset({ x: 0, y: 0 });

    readImageSize(objectUrl)
      .then((size) => {
        setSrc(objectUrl);
        setImageSize(size);
      })
      .catch((err) => {
        URL.revokeObjectURL(objectUrl);
        setError(err instanceof Error ? err.message : 'Failed to open image.');
      });

    return () => {
      URL.revokeObjectURL(objectUrl);
      setSrc(null);
      setImageSize(null);
    };
  }, [open, file]);

  const previewFrame = useMemo(() => {
    const width = Math.max(1, outputWidth);
    const height = Math.max(1, outputHeight);
    const ratio = width / height;
    if (ratio >= 1) {
      return { width: PREVIEW_MAX, height: PREVIEW_MAX / ratio };
    }
    return { width: PREVIEW_MAX * ratio, height: PREVIEW_MAX };
  }, [outputWidth, outputHeight]);

  const baseScale = useMemo(() => {
    if (!imageSize) return 1;
    return Math.max(previewFrame.width / imageSize.width, previewFrame.height / imageSize.height);
  }, [imageSize, previewFrame.height, previewFrame.width]);

  const maxOffset = useMemo(() => {
    if (!imageSize) return { x: 0, y: 0 };
    const renderedW = imageSize.width * baseScale * zoom;
    const renderedH = imageSize.height * baseScale * zoom;
    return {
      x: Math.max(0, (renderedW - previewFrame.width) / 2),
      y: Math.max(0, (renderedH - previewFrame.height) / 2),
    };
  }, [baseScale, imageSize, previewFrame.height, previewFrame.width, zoom]);

  const clampOffset = (next: Point): Point => ({
    x: clamp(next.x, -maxOffset.x, maxOffset.x),
    y: clamp(next.y, -maxOffset.y, maxOffset.y),
  });

  useEffect(() => {
    setOffset((current) => clampOffset(current));
  }, [maxOffset.x, maxOffset.y]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!src || !imageSize) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { active: true, x: event.clientX, y: event.clientY };
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragState.current?.active) return;
    const dx = event.clientX - dragState.current.x;
    const dy = event.clientY - dragState.current.y;
    dragState.current = { ...dragState.current, x: event.clientX, y: event.clientY };
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragState.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
  };

  const apply = async () => {
    if (!src || !imageSize) return;
    setError(null);
    try {
      const blob = await exportEditedPhoto({
        src,
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        frameWidth: previewFrame.width,
        frameHeight: previewFrame.height,
        outputWidth,
        outputHeight,
        zoom,
        rotationDeg,
        offset,
        shape,
      });
      await onApply({ blob, width: outputWidth, height: outputHeight, shape });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-2xl">
      <div className="space-y-4">
        <div
          className={`relative mx-auto overflow-hidden bg-black/70 touch-none select-none cursor-grab active:cursor-grabbing ring-1 ring-black/20 ${
            shape === 'circle' ? 'rounded-full' : 'rounded-xl'
          }`}
          style={{ width: `${previewFrame.width}px`, height: `${previewFrame.height}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {src && imageSize && (
            <img
              src={src}
              alt="Crop preview"
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none"
              style={{
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${baseScale * zoom}) rotate(${rotationDeg}deg)`,
                transformOrigin: 'center center',
              }}
            />
          )}
        </div>

        <p className="text-xs text-gray-600 text-center">
          {shape === 'circle'
            ? 'Drag to reposition your profile photo. Zoom or rotate if needed.'
            : 'Drag to reposition. Zoom and rotate before applying.'}
        </p>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setRotationDeg((v) => v - 90)}
            className="ios-btn min-h-[40px] px-3 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Rotate left
          </button>
          <button
            type="button"
            onClick={() => setRotationDeg((v) => v + 90)}
            className="ios-btn min-h-[40px] px-3 text-sm"
          >
            <RotateCw className="w-4 h-4" />
            Rotate right
          </button>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={applying} className="ios-btn min-h-[42px] flex-1 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={applying || !src || !imageSize}
            className="ios-btn min-h-[42px] flex-1 text-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            {applying ? 'Processing…' : 'Use this photo'}
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Dialog>
  );
};
