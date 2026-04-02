'use client';

import { useState } from 'react';
import type { Criterion } from '@/types';

interface CriteriaEditorProps {
  criteria: Criterion[];
  onChange: (criteria: Criterion[]) => void;
  compact?: boolean;
}

export default function CriteriaEditor({ criteria, onChange, compact = false }: CriteriaEditorProps) {
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const sumsTo100 = totalWeight === 100;

  function getNormalizedPercent(weight: number) {
    if (totalWeight === 0) return 0;
    return (weight / totalWeight) * 100;
  }

  function addCriterion() {
    const name = newName.trim();
    const weight = parseFloat(newWeight);
    if (!name || isNaN(weight) || weight <= 0) return;
    if (criteria.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...criteria, { name, weight }]);
    setNewName('');
    setNewWeight('');
  }

  function removeCriterion(index: number) {
    if (criteria.length <= 1) return;
    onChange(criteria.filter((_, i) => i !== index));
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditName(criteria[index].name);
    setEditWeight(String(criteria[index].weight));
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const name = editName.trim();
    const weight = parseFloat(editWeight);
    if (!name || isNaN(weight) || weight <= 0) return;
    if (criteria.some((c, i) => i !== editingIndex && c.name.toLowerCase() === name.toLowerCase())) return;
    const updated = [...criteria];
    updated[editingIndex] = { name, weight };
    onChange(updated);
    setEditingIndex(null);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  if (compact) {
    return (
      <div>
        <div className="space-y-1 mb-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {editingIndex === i ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="flex-1 px-2 py-1 border border-terracotta rounded text-xs focus:outline-none bg-bg-input" placeholder="Name" autoFocus />
                  <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="w-14 px-2 py-1 border border-terracotta rounded text-xs focus:outline-none bg-bg-input text-center" placeholder="Wt" />
                  <button onClick={saveEdit} className="text-[10px] font-semibold text-terracotta hover:underline">Save</button>
                  <button onClick={cancelEdit} className="text-[10px] font-semibold text-text-muted hover:underline">Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 px-2 py-1 bg-bg-warm rounded text-xs flex items-center justify-between border border-transparent">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{c.weight} → {getNormalizedPercent(c.weight).toFixed(0)}%</span>
                  </span>
                  <button onClick={() => startEdit(i)} className="text-[10px] font-semibold text-text-muted hover:underline">Edit</button>
                  {criteria.length > 1 && (
                    <button onClick={() => removeCriterion(i)} className="text-[10px] font-semibold text-red hover:underline">Remove</button>
                  )}
                </>
              )}
            </div>
          ))}
          {criteria.length === 0 && <p className="text-text-muted text-[10px] py-1">Add at least one criterion.</p>}
        </div>
        <div className="flex gap-1.5">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCriterion()} placeholder="Criterion name..." className="flex-1 px-2 py-1 border border-border rounded text-xs bg-bg-input focus:outline-none focus:border-terracotta transition-all" />
          <input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCriterion()} placeholder="Weight" className="w-14 px-2 py-1 border border-border rounded text-xs bg-bg-input focus:outline-none focus:border-terracotta transition-all text-center" />
          <button onClick={addCriterion} className="border border-border px-2.5 py-1 rounded text-[10px] font-semibold hover:bg-bg-warm transition-colors">Add</button>
        </div>
        <div className="text-[11px] text-text-secondary mt-2">
          {sumsTo100
            ? 'Weights sum to 100, the percentages will adjust to your input'
            : `Total weight: ${totalWeight} | Normalized to 100%`}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {criteria.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_auto_auto] md:grid-cols-[1fr_80px_auto_auto] gap-2 items-center">
            {editingIndex === i ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="px-3 py-1.5 border border-terracotta rounded-lg bg-bg-input text-sm focus:outline-none min-w-0" placeholder="Name" autoFocus />
                <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="px-3 py-1.5 border border-terracotta rounded-lg bg-bg-input text-sm focus:outline-none text-center min-w-0" placeholder="Wt" />
                <button onClick={saveEdit} className="text-xs font-semibold text-terracotta hover:underline text-center">Save</button>
                <button onClick={cancelEdit} className="text-xs font-semibold text-text-muted hover:underline text-center">Cancel</button>
              </>
            ) : (
              <>
                <span className="px-3 py-1.5 bg-bg-warm rounded-lg text-sm border border-transparent min-w-0 truncate">{c.name}</span>
                <span className="py-1.5 text-xs text-text-muted font-mono text-right border border-transparent">{c.weight} → {getNormalizedPercent(c.weight).toFixed(0)}%</span>
                <button onClick={() => startEdit(i)} className="text-xs font-semibold text-text-muted hover:underline text-center">Edit</button>
                {criteria.length > 1 ? (
                  <button onClick={() => removeCriterion(i)} className="text-xs font-semibold text-red hover:underline text-center">Remove</button>
                ) : <span />}
              </>
            )}
          </div>
        ))}
        {criteria.length === 0 && <p className="text-text-muted text-xs py-2">Add at least one criterion.</p>}
      </div>
      <div className="grid grid-cols-[1fr_60px_auto] md:grid-cols-[1fr_80px_auto] gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCriterion()} placeholder="Criterion name..." className="px-3.5 py-2 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all" />
        <input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCriterion()} placeholder="Weight" className="px-3 py-2 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all text-center" />
        <button onClick={addCriterion} className="border border-border px-4 py-2 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors">Add</button>
      </div>
      <div className="text-xs text-text-secondary mt-2">
        {sumsTo100
          ? 'Weights sum to 100, the percentages will adjust to your input'
          : `Total weight: ${totalWeight} | Normalized to 100%`}
      </div>
    </div>
  );
}
