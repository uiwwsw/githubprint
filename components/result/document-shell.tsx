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
    <article className="document-page mx-auto rounded-[2rem] border border-black/[0.08] bg-[#fffdf9] p-6 shadow-[0_40px_120px_-52px_rgba(0,0,0,0.45)] sm:p-9">
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
    <div className={cn("inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-3 py-1.5 text-xs text-neutral-600", className)}>
      <span className="uppercase tracking-[0.2em] text-neutral-400">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}
