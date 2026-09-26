import React, { useState, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Upload, Link, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

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
 * and permanently storable in Convex Cloud, IndexedDB, and localStorage without quota issues.
 */
async function compressImageFile(file: File, maxDimension = 1200, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
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

          // Fill white background for transparent PNGs converted to JPEG, or preserve WebP
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
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
