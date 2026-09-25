import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles } from 'lucide-react';
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

export const ImageManager: React.FC<ImageManagerProps> = ({ images, onChange }) => {
  const [newUrl, setNewUrl] = useState('');

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    onChange([...images, newUrl.trim()]);
    setNewUrl('');
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
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
      </div>

      {/* Add by URL */}
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
            placeholder="أدخل رابط الصورة (URL) ثم اضغط إضافة"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <Button
          type="button"
          onClick={handleAddUrl}
          size="sm"
          className="text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          إضافة صورة
        </Button>
      </div>

      {/* Quick Studio Presets */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
        <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>صور احترافية جاهزة للاستخدام (High-Res Studio Presets):</span>
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
          <div className="text-xs">لم تتم إضافة أي صور بعد. أضف رابط صورة أو اختر من القوالب أعلاه.</div>
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
                <div className="text-[11px] font-bold text-slate-800 truncate">
                  صورة #{index + 1}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {imgUrl}
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
