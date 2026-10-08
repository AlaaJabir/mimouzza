import React, { useState, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Upload, Link, CheckCircle2, Video, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { db } from '../../../convex/db';
import { isVideoUrl } from '../../lib/media';

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const PRESET_STUDIO_IMAGES = [
  { label: 'Moroccan Beauty Serum', url: '/src/assets/images/seed_beauty_serum_1790331758543.jpg' },
  { label: 'Wireless ANC Headphones', url: '/src/assets/images/seed_headphones_1790331773135.jpg' },
  { label: 'Luxury Chronograph Watch', url: '/src/assets/images/seed_luxury_watch_1790331784875.jpg' },
  { label: 'Skincare Cosmetics Jar', url: 'https://images.unsplash.com/photo-1608248597359-577c27632617?auto=format&fit=crop&w=800&q=80' },
  { label: 'Studio Black Audio', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Minimalist Wristwatch', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80' },
];

/**
 * Compresses and resizes an uploaded image file so it is fast, lightweight (~80-180KB),
 * preserves transparency for PNG/WEBP files, and uploads it directly to the server image store
 * (`/api/db/image`) so saving a product never hits HTTP payload size limits.
 */
export async function compressImageFile(file: File, maxDimension = 850, quality = 0.76): Promise<string> {
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('ملف الصورة فارغ'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          const isTransparentFormat =
            file.type === 'image/png' ||
            file.type === 'image/webp' ||
            file.name.toLowerCase().endsWith('.png') ||
            file.name.toLowerCase().endsWith('.webp');

          if (!isTransparentFormat) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          } else {
            ctx.clearRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Use WebP for PNG/WebP to preserve alpha transparency while keeping size compact
          const outputMime = isTransparentFormat ? 'image/webp' : 'image/jpeg';
          let compressed = canvas.toDataURL(outputMime, quality);

          // If the browser doesn't support WebP encoding (falls back to huge uncompressed PNG),
          // scale down and encode compactly so multiple images easily fit inside a 1MB Convex Cloud document.
          if (compressed.length > 100_000) {
            const scale = 0.72;
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = Math.max(1, Math.round(width * scale));
            smallCanvas.height = Math.max(1, Math.round(height * scale));
            const sCtx = smallCanvas.getContext('2d');
            if (sCtx) {
              if (!isTransparentFormat) {
                sCtx.fillStyle = '#FFFFFF';
                sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
              }
              sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
              compressed = smallCanvas.toDataURL('image/webp', 0.68);
              if (compressed.length > 100_000 || !compressed.startsWith('data:image/webp')) {
                sCtx.fillStyle = '#FFFFFF';
                sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
                sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
                compressed = smallCanvas.toDataURL('image/jpeg', 0.65);
              }
            }
          }

          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });

  return dataUri;
}

export const ImageManager: React.FC<ImageManagerProps> = ({ images, onChange }) => {
  const [newUrl, setNewUrl] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    onChange([...images, newUrl.trim()]);
    setNewUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    setUploadSuccessCount(0);

    try {
      const fileArray = Array.from(files);
      const compressedImages = await Promise.all(
        fileArray.map((file) => compressImageFile(file))
      );

      // If the only existing image was the default seed image, put the user's uploaded image first as primary
      const isDefaultSeedOnly =
        images.length === 1 &&
        images[0] === '/src/assets/images/seed_beauty_serum_1790331758543.jpg';

      const updatedImages = isDefaultSeedOnly
        ? [...compressedImages]
        : [...images, ...compressedImages];

      onChange(updatedImages);
      setUploadSuccessCount(compressedImages.length);
      setTimeout(() => setUploadSuccessCount(0), 4000);
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleAddPreset = (url: string) => {
    if (images.includes(url)) return;
    onChange([...images, url]);
  };

  return (
    <div className="space-y-4 text-left" dir="ltr">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider">
          Product Gallery Images
          <span className="text-neutral-400 font-normal ml-2 normal-case">
            ({images.length} images — first image is primary)
          </span>
        </label>

        {/* Upload Mode Selector */}
        <div className="flex items-center gap-1 bg-[#F8F8F6] p-1 rounded-full border border-neutral-200">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              mode === 'upload' ? 'bg-[#111111] text-white shadow-2xs' : 'text-neutral-500 hover:text-[#111111]'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              mode === 'url' ? 'bg-[#111111] text-white shadow-2xs' : 'text-neutral-500 hover:text-[#111111]'
            }`}
          >
            <Link className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Upload Box */}
      {mode === 'upload' ? (
        <div className="border-2 border-dashed border-neutral-300 hover:border-[#FF6B00] rounded-2xl p-5 text-center bg-[#F8F8F6] transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="product-image-file-input"
          />
          <label
            htmlFor="product-image-file-input"
            className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#111111]">
              {isProcessingFile
                ? 'Compressing & saving images to database...'
                : 'Click to upload product photos (JPG, PNG, WEBP)'}
            </div>
            <p className="text-[11px] text-neutral-400">
              Automatically compressed and persisted in your database
            </p>
            {uploadSuccessCount > 0 && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Uploaded {uploadSuccessCount} image(s) successfully!</span>
              </div>
            )}
          </label>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="Paste image URL (https://...) and click Add"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 rounded-full text-xs font-bold shrink-0 bg-[#111111] text-white flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add URL</span>
          </button>
        </div>
      )}

      {/* Quick Studio Presets */}
      <div className="p-3.5 bg-[#F8F8F6] border border-neutral-200/80 rounded-2xl space-y-2">
        <div className="text-[11px] font-bold text-[#111111] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Quick Studio Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_STUDIO_IMAGES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset.url)}
              className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-[#FF6B00] hover:text-[#111111] transition-colors cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Thumbnails & Ordering List */}
      {images.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-neutral-200 rounded-2xl text-center text-neutral-400 space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-neutral-300" />
          <div className="text-xs">No images added yet. Upload a photo or paste a URL above.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className={`relative flex items-center gap-3 p-2.5 rounded-2xl border bg-white shadow-2xs group ${
                index === 0 ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/15' : 'border-neutral-200'
              }`}
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                <img
                  src={imgUrl}
                  alt={`Product img ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-[#FF6B00] text-white font-black text-[9px] text-center py-0.5">
                    PRIMARY
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#111111] truncate flex items-center gap-1.5">
                  <span>Image #{index + 1}</span>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="text-[10px] text-[#FF6B00] hover:underline font-semibold cursor-pointer"
                    >
                      (Set Primary)
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400 truncate font-mono">
                  {imgUrl.startsWith('data:') ? 'Persisted in DB' : imgUrl}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1 rounded hover:bg-neutral-100 text-neutral-500 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 rounded hover:bg-neutral-100 text-neutral-500 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface DescriptionImagesManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export const DescriptionImagesManager: React.FC<DescriptionImagesManagerProps> = ({
  images,
  onChange,
}) => {
  const [linkBoxes, setLinkBoxes] = useState<string[]>(['']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLinkBoxChange = (idx: number, val: string) => {
    setLinkBoxes((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };

  const handleAddLinkFromBox = (idx: number) => {
    const url = (linkBoxes[idx] || '').trim();
    if (!url) return;
    onChange([...images, url]);
    setLinkBoxes((prev) => {
      const updated = prev.map((item, i) => (i === idx ? '' : item));
      return updated.length === 0 ? [''] : updated;
    });
  };

  const handleAddAnotherLinkBox = () => {
    setLinkBoxes((prev) => [...prev, '']);
  };

  const handleRemoveLinkBox = (idx: number) => {
    if (linkBoxes.length <= 1) {
      setLinkBoxes(['']);
      return;
    }
    setLinkBoxes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadNotice('');
    try {
      const fileArray = Array.from(files);
      const processed = await Promise.all(
        fileArray.map((file) => compressImageFile(file, 1400, 0.86))
      );
      onChange([...images, ...processed]);
      setUploadNotice(`Imported and saved ${processed.length} description image(s)!`);
      setTimeout(() => setUploadNotice(''), 4000);
    } catch (err) {
      console.error('Error importing description images:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateExistingImageUrl = (index: number, newUrl: string) => {
    const updated = images.map((img, i) => (i === index ? newUrl : img));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3 p-4 rounded-2xl border border-neutral-200 bg-white space-y-4 text-left" dir="ltr">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div>
          <label className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#FF6B00]" />
            <span>Description Feature Images & MP4 Videos (below Arabic description)</span>
          </label>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Displayed directly below the product description. Supports PNG, JPG, and MP4 video links (auto-play).
          </p>
        </div>

        {/* Direct File Import Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/*"
            multiple
            onChange={handleImportFiles}
            className="hidden"
            id="desc-images-import-input"
          />
          <label
            htmlFor="desc-images-import-input"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Importing...' : 'Upload PNG / JPG'}</span>
          </label>
        </div>
      </div>

      {uploadNotice && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadNotice}</span>
        </div>
      )}

      {/* Link Input Boxes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
            <Link className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Media URL Input Slots (Image or MP4 Video):</span>
          </span>
          <button
            type="button"
            onClick={handleAddAnotherLinkBox}
            className="text-[11px] font-bold text-[#111111] bg-[#F8F8F6] px-3 py-1 rounded-full border border-neutral-200 hover:border-[#FF6B00] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add URL Slot</span>
          </button>
        </div>

        <div className="space-y-2">
          {linkBoxes.map((boxVal, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={boxVal}
                  onChange={(e) => handleLinkBoxChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLinkFromBox(idx);
                    }
                  }}
                  placeholder={`Slot #${idx + 1}: Paste Image URL or MP4 Video URL (https://.../video.mp4)`}
                  dir="ltr"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] font-mono text-left"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddLinkFromBox(idx)}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-[#111111] hover:bg-neutral-800 text-white shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              {linkBoxes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLinkBox(idx)}
                  className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Added Description Media List */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-[#111111]">
            Saved Description Media ({images.length}):
          </div>
          <div className="space-y-2">
            {images.map((imgUrl, index) => {
              const isDataUri = imgUrl.startsWith('data:image/');
              const isVideo = isVideoUrl(imgUrl);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-neutral-200 bg-[#F8F8F6]"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 border border-neutral-200 shrink-0 relative flex items-center justify-center">
                    {isVideo ? (
                      <>
                        <video
                          src={imgUrl}
                          muted
                          playsInline
                          autoPlay
                          loop
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                          <Play className="w-4 h-4 text-white fill-white drop-shadow" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={imgUrl}
                        alt={`Description media ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {isVideo ? (
                        <span className="text-[11px] font-extrabold text-white bg-purple-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          <span>MP4 Video #{index + 1}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-white bg-[#111111] px-2.5 py-0.5 rounded-full">
                          Desc Image #{index + 1}
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {isVideo ? '✓ Auto-play Active' : '✓ Saved in DB'}
                      </span>
                    </div>

                    {isDataUri ? (
                      <div className="text-[11px] text-neutral-500 font-mono truncate">
                        Uploaded PNG / JPG (Stored in DB)
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={imgUrl}
                        onChange={(e) => handleUpdateExistingImageUrl(index, e.target.value)}
                        dir="ltr"
                        className="w-full px-2.5 py-1 text-xs font-mono text-left rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
