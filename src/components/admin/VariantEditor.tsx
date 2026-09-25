import React, { useState } from 'react';
import { ProductVariantGroup } from '../../../convex/schema';
import { Plus, Trash2, Tag, X } from 'lucide-react';
import { Button } from '../ui/button';

interface VariantEditorProps {
  variants: ProductVariantGroup[];
  onChange: (variants: ProductVariantGroup[]) => void;
}

export const VariantEditor: React.FC<VariantEditorProps> = ({ variants, onChange }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState<Record<string, string>>({});

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: ProductVariantGroup = {
      id: 'var_' + Math.random().toString(36).substring(2, 7),
      name: newGroupName.trim(),
      options: [],
    };
    onChange([...variants, newGroup]);
    setNewGroupName('');
  };

  const handleRemoveGroup = (groupId: string) => {
    onChange(variants.filter((v) => v.id !== groupId));
  };

  const handleAddOption = (groupId: string) => {
    const val = (newOptionValue[groupId] || '').trim();
    if (!val) return;

    const updated = variants.map((v) => {
      if (v.id === groupId) {
        if (v.options.includes(val)) return v;
        return { ...v, options: [...v.options, val] };
      }
      return v;
    });

    onChange(updated);
    setNewOptionValue((prev) => ({ ...prev, [groupId]: '' }));
  };

  const handleRemoveOption = (groupId: string, optionIndex: number) => {
    const updated = variants.map((v) => {
      if (v.id === groupId) {
        return {
          ...v,
          options: v.options.filter((_, idx) => idx !== optionIndex),
        };
      }
      return v;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-800">
            خيارات المنتج ومتغيراته (Variants & Options)
          </label>
          <p className="text-[11px] text-slate-500">
            أضف خيارات كالحجم، اللون، أو العروض التوفيرية ليختار الزبون منها في استمارة الطلب
          </p>
        </div>
      </div>

      {/* Add New Variant Group */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddGroup();
            }
          }}
          placeholder="مثال: الحجم / المقاس أو اللون أو باقات العرض"
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <Button
          type="button"
          onClick={handleAddGroup}
          size="sm"
          className="text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          إضافة نوع خيار جديد
        </Button>
      </div>

      {/* Variant Groups List */}
      {variants.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          لا توجد خيارات مخصصة لهذا المنتج (يمكن للمشتري اختيار الكمية فقط).
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((group) => (
            <div
              key={group.id}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900">{group.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الخيار</span>
                </button>
              </div>

              {/* Options Chips */}
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt, optIdx) => (
                  <span
                    key={optIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(group.id, optIdx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Option Value */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newOptionValue[group.id] || ''}
                  onChange={(e) =>
                    setNewOptionValue((prev) => ({
                      ...prev,
                      [group.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption(group.id);
                    }
                  }}
                  placeholder={`أضف قيمة جديدة لـ (${group.name})، مثلاً: S, M, L...`}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption(group.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  + إضافة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
