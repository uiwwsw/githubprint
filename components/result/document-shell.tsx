import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DocumentShell({
  accent,
  children,
}: {
  accent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="document-page mx-auto rounded-[1.5rem] border border-black/[0.08] bg-[#fffdf9] p-4 shadow-[0_40px_120px_-52px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:p-9">
      {accent ? <div className="mb-6">{accent}</div> : null}
      {children}
    </article>
  );
}

export function MetaRibbon({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-3 py-1.5 text-xs text-neutral-600", className)}>
      <span className="shrink-0 whitespace-nowrap uppercase tracking-[0.2em] text-neutral-400">{label}</span>
      <span className="min-w-0 break-words font-medium text-neutral-800">{value}</span>
    </div>
  );
}
