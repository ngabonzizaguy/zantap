"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { MenuItemAddOnGroup } from "@/lib/types";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface Props {
  groups: MenuItemAddOnGroup[];
  disabled?: boolean;
  onChange: (groups: MenuItemAddOnGroup[]) => void;
}

const inputClass = "h-11 min-w-0 rounded-brand-md border border-hairline-strong bg-surface-card px-3 font-body text-body-sm text-ink focus:border-2 focus:border-primary focus:outline-none";
const nextId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function AddOnGroupsEditor({ groups, disabled, onChange }: Props) {
  const updateGroup = (index: number, patch: Partial<MenuItemAddOnGroup>) =>
    onChange(groups.map((group, i) => i === index ? { ...group, ...patch } : group));

  const addGroup = () => onChange([...groups, {
    id: nextId("group"), name: "Choose extras", required: false,
    selection: "SINGLE", choices: [{ id: nextId("choice"), label: "New choice", priceRwf: 0, isAvailable: true }],
  }]);

  return <div className="space-y-4">
    <div>
      <h3 className="font-display text-display-sm text-ink">Add-ons</h3>
      <p className="mt-1 font-body text-caption text-muted">Create up to 6 item-specific groups. Prices apply per item unit.</p>
    </div>
    {groups.map((group, groupIndex) => <section key={group.id} className="rounded-brand-xl border border-hairline bg-surface-card p-4">
      <div className="flex items-center gap-2">
        <input aria-label="Group name" value={group.name} maxLength={60} disabled={disabled} onChange={(e) => updateGroup(groupIndex, { name: e.target.value })} className={cn(inputClass, "flex-1 font-medium")} />
        <button type="button" aria-label="Move group up" disabled={disabled || groupIndex === 0} onClick={() => onChange(move(groups, groupIndex, -1))} className="flex h-11 w-11 items-center justify-center disabled:opacity-30"><ArrowUp size={17} /></button>
        <button type="button" aria-label="Move group down" disabled={disabled || groupIndex === groups.length - 1} onClick={() => onChange(move(groups, groupIndex, 1))} className="flex h-11 w-11 items-center justify-center disabled:opacity-30"><ArrowDown size={17} /></button>
        <button type="button" aria-label="Delete group" disabled={disabled} onClick={() => onChange(groups.filter((_, i) => i !== groupIndex))} className="flex h-11 w-11 items-center justify-center text-error"><Trash2 size={17} /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="font-body text-caption text-muted">Rule<select value={group.required ? "required" : "optional"} onChange={(e) => updateGroup(groupIndex, { required: e.target.value === "required" })} className={cn(inputClass, "mt-1 w-full")}><option value="optional">Optional</option><option value="required">Required</option></select></label>
        <label className="font-body text-caption text-muted">Selection<select value={group.selection} onChange={(e) => updateGroup(groupIndex, { selection: e.target.value as "SINGLE" | "MULTIPLE", ...(e.target.value === "MULTIPLE" ? { maxSelections: Math.min(2, group.choices.length) } : { maxSelections: undefined }) })} className={cn(inputClass, "mt-1 w-full")}><option value="SINGLE">Single</option><option value="MULTIPLE">Multiple</option></select></label>
        {group.selection === "MULTIPLE" ? <label className="col-span-2 font-body text-caption text-muted sm:col-span-1">Maximum<input type="number" min={1} max={group.choices.length} value={group.maxSelections ?? 1} onChange={(e) => updateGroup(groupIndex, { maxSelections: Number(e.target.value) })} className={cn(inputClass, "mt-1 w-full")} /></label> : null}
      </div>
      <div className="mt-4 space-y-2">
        {group.choices.map((choice, choiceIndex) => <div key={choice.id} className="grid grid-cols-[minmax(0,1fr)_100px_44px] items-center gap-2 rounded-brand-lg bg-canvas-soft p-2">
          <input aria-label="Choice label" value={choice.label} maxLength={60} onChange={(e) => updateGroup(groupIndex, { choices: group.choices.map((candidate, i) => i === choiceIndex ? { ...candidate, label: e.target.value } : candidate) })} className={inputClass} />
          <input aria-label={`${choice.label} price`} inputMode="numeric" value={choice.priceRwf.toLocaleString("en-US")} onChange={(e) => updateGroup(groupIndex, { choices: group.choices.map((candidate, i) => i === choiceIndex ? { ...candidate, priceRwf: Number(e.target.value.replace(/\D/g, "")) || 0 } : candidate) })} className={cn(inputClass, "w-full font-mono")} />
          <button type="button" aria-label={choice.isAvailable ? "Hide choice" : "Show choice"} onClick={() => updateGroup(groupIndex, { choices: group.choices.map((candidate, i) => i === choiceIndex ? { ...candidate, isAvailable: !candidate.isAvailable } : candidate) })} className="flex h-11 w-11 items-center justify-center">{choice.isAvailable ? <Eye size={17} /> : <EyeOff size={17} />}</button>
          <div className="col-span-3 flex justify-end gap-1">
            <button type="button" aria-label="Move choice up" disabled={choiceIndex === 0} onClick={() => updateGroup(groupIndex, { choices: move(group.choices, choiceIndex, -1) })} className="flex h-10 w-10 items-center justify-center disabled:opacity-30"><ArrowUp size={15} /></button>
            <button type="button" aria-label="Move choice down" disabled={choiceIndex === group.choices.length - 1} onClick={() => updateGroup(groupIndex, { choices: move(group.choices, choiceIndex, 1) })} className="flex h-10 w-10 items-center justify-center disabled:opacity-30"><ArrowDown size={15} /></button>
            <button type="button" aria-label="Delete choice" disabled={group.choices.length <= 1} onClick={() => updateGroup(groupIndex, { choices: group.choices.filter((_, i) => i !== choiceIndex), maxSelections: group.maxSelections ? Math.min(group.maxSelections, group.choices.length - 1) : undefined })} className="flex h-10 w-10 items-center justify-center text-error disabled:opacity-30"><Trash2 size={15} /></button>
          </div>
        </div>)}
      </div>
      <Button type="button" variant="outline" disabled={disabled || group.choices.length >= 12} onClick={() => updateGroup(groupIndex, { choices: [...group.choices, { id: nextId("choice"), label: `Choice ${group.choices.length + 1}`, priceRwf: 0, isAvailable: true }] })} className="mt-3"><Plus size={15} /> Add choice</Button>
    </section>)}
    <Button type="button" variant="outline" disabled={disabled || groups.length >= 6} onClick={addGroup} className="w-full"><Plus size={16} /> Add group</Button>
  </div>;
}
