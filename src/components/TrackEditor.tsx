'use client';

import { useState } from 'react';

interface TrackEditorProps {
  tracks: string[];
  onChange: (tracks: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  emptyText?: string;
  compact?: boolean;
}

export default function TrackEditor({ tracks, onChange, placeholder = 'Add an item...', addLabel = 'Add', emptyText = 'No items added yet.', compact = false }: TrackEditorProps) {
  const [newTrack, setNewTrack] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  function addTrack() {
    const name = newTrack.trim();
    if (!name) return;
    if (tracks.some((t) => t.toLowerCase() === name.toLowerCase())) return;
    onChange([...tracks, name]);
    setNewTrack('');
  }

  function removeTrack(index: number) {
    onChange(tracks.filter((_, i) => i !== index));
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(tracks[index]);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const name = editValue.trim();
    if (!name) return;
    if (tracks.some((t, i) => i !== editingIndex && t.toLowerCase() === name.toLowerCase())) return;
    const updated = [...tracks];
    updated[editingIndex] = name;
    onChange(updated);
    setEditingIndex(null);
    setEditValue('');
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditValue('');
  }

  if (compact) {
    return (
      <div>
        <div className="space-y-1 mb-2">
          {tracks.map((track, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {editingIndex === i ? (
                <>
                  <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="flex-1 px-2 py-1 border border-terracotta rounded text-xs focus:outline-none bg-bg-input" autoFocus />
                  <button onClick={saveEdit} className="text-[10px] font-semibold text-terracotta hover:underline">Save</button>
                  <button onClick={cancelEdit} className="text-[10px] font-semibold text-text-muted hover:underline">Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 px-2 py-1 bg-bg-warm rounded text-xs">{track}</span>
                  <button onClick={() => startEdit(i)} className="text-[10px] font-semibold text-text-muted hover:underline">Edit</button>
                  <button onClick={() => removeTrack(i)} className="text-[10px] font-semibold text-red hover:underline">Remove</button>
                </>
              )}
            </div>
          ))}
          {tracks.length === 0 && <p className="text-text-muted text-[10px] py-1">{emptyText}</p>}
        </div>
        <div className="flex gap-1.5">
          <input value={newTrack} onChange={(e) => setNewTrack(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTrack()} placeholder={placeholder} className="flex-1 px-2 py-1 border border-border rounded text-xs bg-bg-input focus:outline-none focus:border-terracotta transition-all" />
          <button onClick={addTrack} className="border border-border px-2.5 py-1 rounded text-[10px] font-semibold hover:bg-bg-warm transition-colors">{addLabel}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {tracks.map((track, i) => (
          <div key={i} className="flex items-center gap-2">
            {editingIndex === i ? (
              <>
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="flex-1 px-3 py-1.5 border border-terracotta rounded-lg bg-bg-input text-sm focus:outline-none" autoFocus />
                <button onClick={saveEdit} className="text-xs font-semibold text-terracotta hover:underline">Save</button>
                <button onClick={cancelEdit} className="text-xs font-semibold text-text-muted hover:underline">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 px-3 py-1.5 bg-bg-warm rounded-lg text-sm">{track}</span>
                <button onClick={() => startEdit(i)} className="text-xs font-semibold text-text-muted hover:underline">Edit</button>
                <button onClick={() => removeTrack(i)} className="text-xs font-semibold text-red hover:underline">Remove</button>
              </>
            )}
          </div>
        ))}
        {tracks.length === 0 && <p className="text-text-muted text-xs py-2">{emptyText}</p>}
      </div>
      <div className="flex gap-2">
        <input value={newTrack} onChange={(e) => setNewTrack(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTrack()} placeholder={placeholder} className="flex-1 px-3.5 py-2 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all" />
        <button onClick={addTrack} className="border border-border px-4 py-2 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors">{addLabel}</button>
      </div>
    </div>
  );
}
