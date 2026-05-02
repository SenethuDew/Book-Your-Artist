"use client";

interface Props {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function QuickPromptChips({ prompts, onSelect, disabled }: Props) {
  if (!prompts.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(p)}
          className="rounded-full border border-violet-400/25 bg-violet-500/10 hover:bg-violet-500/20 text-violet-100 text-xs font-bold px-3 py-1.5 transition-all disabled:opacity-40"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
