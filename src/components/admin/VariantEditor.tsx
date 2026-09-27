import React, { useState } from 'react';
import { ProductVariantGroup } from '../../../convex/schema';
import { Plus, Trash2, Tag, X } from 'lucide-react';

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
    <div className="space-y-4 text-left" dir="ltr">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider">
            Product Variants &amp; Bundles
          </label>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Add size, color, or bundle options (can be written in Arabic for the landing page checkout form).
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
          placeholder="e.g. المقاس / الحجم or اللون or العرض"
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
        />
        <button
          type="button"
          onClick={handleAddGroup}
          className="px-4 py-2 rounded-full bg-[#111111] hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Variant Group</span>
        </button>
      </div>

      {/* Variant Groups List */}
      {variants.length === 0 ? (
        <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-neutral-200/80 text-center text-xs text-neutral-500">
          No custom variants added (customers will select quantity tiers 1, 2, or 3).
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((group) => (
            <div
              key={group.id}
              className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-xs font-extrabold text-[#111111]">{group.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Options Chips */}
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt, optIdx) => (
                  <span
                    key={optIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F8F6] border border-neutral-200 text-xs font-semibold text-[#111111]"
                  >
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(group.id, optIdx)}
                      className="text-neutral-400 hover:text-rose-600 cursor-pointer"
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
                  placeholder={`Add option for (${group.name}), e.g. XL, أسود, عبوتين (299 DH)...`}
                  className="flex-1 px-3.5 py-1.5 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:border-[#FF6B00]"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption(group.id)}
                  className="px-3.5 py-1.5 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-xs font-bold text-white cursor-pointer transition-colors"
                >
                  + Add Option
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
