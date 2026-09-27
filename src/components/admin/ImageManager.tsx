import React, { useState, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Upload, Link, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { db } from '../../../convex/db';

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const PRESET_STUDIO_IMAGES = [
  { label: 'سيروم الجمال المغربي (Beauty Serum)', url: '/src/assets/images/seed_beauty_serum_1790331758543.jpg' },
  { label: 'سماعات احترافية ANC (Wireless Headphones)', url: '/src/assets/images/seed_headphones_1790331773135.jpg' },
  { label: 'ساعة كرونوغراف ياقوتية (Luxury Watch)', url: '/src/assets/images/seed_luxury_watch_1790331784875.jpg' },
  { label: 'منتج عناية بالبشرة (Cosmetics Jar)', url: 'https://images.unsplash.com/photo-1608248597359-577c27632617?auto=format&fit=crop&w=800&q=80' },
  { label: 'سماعات أذن سوداء (Black Audio)', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' },
  { label: 'ساعة يد كلاسيكية (Minimal Watch)', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80' },
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          صور المنتج (Product Images)
          <span className="text-slate-400 font-normal ml-2">
            ({images.length} صور مضافة — الصورة الأولى هي الصورة الرئيسية)
          </span>
        </label>

        {/* Upload Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              mode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>رفع من الجهاز (Upload)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              mode === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Link className="w-3 h-3" />
            <span>رابط صورة (URL)</span>
          </button>
        </div>
      </div>

      {/* Upload Box */}
      {mode === 'upload' ? (
        <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-4 text-center bg-slate-50/50 transition-colors">
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
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-800">
              {isProcessingFile
                ? 'جاري ضغط وحفظ الصور في قاعدة البيانات...'
                : 'انقر لاختيار صور من جهازك (JPG, PNG, WEBP)'}
            </div>
            <p className="text-[11px] text-slate-400">
              يتم ضغط وتحسين الصور تلقائياً وحفظها بشكل دائم في قاعدة البيانات
            </p>
            {uploadSuccessCount > 0 && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم رفع وتجهيز {uploadSuccessCount} صور بنجاح!</span>
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
              placeholder="الصق رابط الصورة (https://...) ثم اضغط إضافة"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddUrl}
            size="sm"
            className="text-xs shrink-0 bg-slate-900 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            إضافة الرابط
          </Button>
        </div>
      )}

      {/* Quick Studio Presets */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
        <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>صور استوديو احترافية جاهزة (Studio Presets):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_STUDIO_IMAGES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset.url)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-slate-900 transition-colors cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Thumbnails & Ordering List */}
      {images.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
          <div className="text-xs">لم تتم إضافة أي صور بعد. ارفع صورة أو الصق رابطاً أعلاه.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className={`relative flex items-center gap-3 p-2.5 rounded-xl border bg-white shadow-2xs group ${
                index === 0 ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
              }`}
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img
                  src={imgUrl}
                  alt={`Product img ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-slate-950 font-black text-[9px] text-center py-0.5">
                    الرئيسية
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1.5">
                  <span>صورة #{index + 1}</span>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline"
                      title="تعيين كصورة رئيسية"
                    >
                      (تعيين كرئيسية)
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {imgUrl.startsWith('data:') ? 'محفوظة في قاعدة البيانات (Compressed DB)' : imgUrl}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
                  title="حذف الصورة"
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
      setUploadNotice(`تم استيراد وحفظ ${processed.length} صورة (PNG / JPG) تحت الوصف بنجاح!`);
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
    <div className="mt-3 p-4 rounded-xl border border-amber-200/90 bg-amber-50/40 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
        <div>
          <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>صور إضافية أسفل الوصف (Description Images / PNG — روابط أو استيراد)</span>
          </label>
          <p className="text-[11px] text-slate-600 mt-0.5">
            تظهر هذه الصور مباشرة تحت نص الوصف في جميع صفحات الهبوط وتُحفظ تلقائياً في قاعدة البيانات (DB).
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'جاري استيراد الصور...' : 'استيراد صور / PNG من الجهاز'}</span>
          </label>
        </div>
      </div>

      {uploadNotice && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadNotice}</span>
        </div>
      )}

      {/* Link Input Boxes (Des cases des liens pour les images / PNG) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Link className="w-3.5 h-3.5 text-amber-600" />
            <span>خانات روابط الصور (Cases des liens d&apos;images / PNG URL):</span>
          </span>
          <button
            type="button"
            onClick={handleAddAnotherLinkBox}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-white px-2.5 py-1 rounded-md border border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>إضافة خانة رابط جديدة</span>
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
                  placeholder={`خانة رابط صورة #${idx + 1}: الصق رابط الصورة أو PNG (https://...) ثم اضغط إضافة`}
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-left"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddLinkFromBox(idx)}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                إضافة للوصف
              </Button>
              {linkBoxes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLinkBox(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer"
                  title="حذف الخانة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Added Description Images List */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-700">
            الصور المضافة تحت الوصف حالياً ({images.length} صور محفوظة في قاعدة البيانات):
          </div>
          <div className="space-y-2">
            {images.map((imgUrl, index) => {
              const isDataUri = imgUrl.startsWith('data:');
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    <img
                      src={imgUrl}
                      alt={`Description img ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-slate-900 bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        صورة الوصف #{index + 1}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        ✓ محفوظة في قاعدة البيانات
                      </span>
                    </div>

                    {isDataUri ? (
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        صورة PNG / JPG مستوردة من الجهاز (Stored in DB)
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={imgUrl}
                        onChange={(e) => handleUpdateExistingImageUrl(index, e.target.value)}
                        dir="ltr"
                        className="w-full px-2.5 py-1 text-xs font-mono text-left rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
                      title="حذف الصورة"
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
