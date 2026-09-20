"use client";

import React, { useState } from "react";
import { useExpense } from "@/context/ExpenseContext";
import { Category } from "@/types";
import { EMOJI_OPTIONS, BRUTAL_PALETTE } from "@/lib/constants";
import { X, Plus, Trash2, Edit2, Check } from "lucide-react";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useExpense();

  const [isAdding, setIsAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState("#FFD84D");

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingCat(null);
    setName("");
    setIcon("✨");
    setColor("#FFD84D");
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setIsAdding(false);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCat) {
      await updateCategory({
        ...editingCat,
        name: name.trim(),
        icon,
        color,
      });
      setEditingCat(null);
    } else {
      await addCategory({
        name: name.trim(),
        icon,
        color,
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FFF9E8] border-4 border-[#111111] rounded-3xl brutal-shadow-lg max-h-[85vh] flex flex-col z-10 animate-slideUp overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b-3 border-[#111111]">
          <h3 className="font-extrabold text-base uppercase tracking-wider text-[#111111]">
            Manage Categories
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FFF9E8] border-2 border-[#111111] brutal-shadow-sm flex items-center justify-center hover:bg-[#FF6B6B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Add/Edit Form */}
          {isAdding || editingCat ? (
            <form onSubmit={handleSave} className="bg-white border-3 border-[#111111] p-3.5 rounded-2xl brutal-shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
                <h4 className="font-black text-xs uppercase text-[#111111]">
                  {editingCat ? "Edit Category" : "New Custom Category"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingCat(null);
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-[#111111]"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[#111111] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym, Pet Care, Gaming"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full brutal-input text-sm py-2"
                  required
                  autoFocus
                />
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block text-[11px] font-black uppercase text-[#111111] mb-1">
                  Select Icon: {icon}
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#FFF9E8] border-2 border-[#111111] rounded-xl">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-7 h-7 text-base rounded-md flex items-center justify-center transition-transform ${
                        icon === em ? "bg-[#FFD84D] border border-[#111111] scale-110" : "hover:bg-white"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-[11px] font-black uppercase text-[#111111] mb-1">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  {BRUTAL_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-lg border-2 border-[#111111] transition-transform ${
                        color === c ? "scale-125 ring-2 ring-[#111111]" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full brutal-btn bg-[#7BF1A8] hover:bg-[#FFD84D] py-2 text-xs font-black uppercase tracking-wider rounded-xl"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{editingCat ? "Update Category" : "Add Category"}</span>
              </button>
            </form>
          ) : (
            <button
              onClick={handleStartAdd}
              className="w-full brutal-btn bg-[#FFD84D] hover:bg-[#FF8FAB] py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Category</span>
            </button>
          )}

          {/* Categories Grid List */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Available Categories ({categories.length})
            </span>

            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border-2 border-[#111111] p-2 rounded-xl brutal-shadow-sm flex items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      style={{ backgroundColor: cat.color }}
                      className="w-7 h-7 rounded-lg border border-[#111111] flex items-center justify-center text-sm shrink-0"
                    >
                      {cat.icon}
                    </span>
                    <span className="font-extrabold text-xs text-[#111111] truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1 hover:bg-yellow-100 rounded text-gray-700"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {cat.isCustom && (
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
