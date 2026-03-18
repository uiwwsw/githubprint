import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-14 w-full rounded-[1.35rem] border border-black/10 bg-white/80 px-5 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5",
        className,
      )}
      {...props}
    />
  );
}
