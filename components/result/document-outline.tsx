"use client";

import { useEffect, useRef, useState } from "react";

export function DocumentOutline({
  label,
  documentKey,
}: {
  label: string;
  documentKey: string;
}) {
  const [headings, setHeadings] = useState<{ id: string; title: string }[]>([]);
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-document]");
    if (!root) return;
    const entries = Array.from(root.querySelectorAll<HTMLElement>("h2")).filter(
      (heading) => !heading.closest("[data-export-ignore], .screen-only"),
    );
    const addedIds: HTMLElement[] = [];
    setHeadings(
      entries
        .map((heading, index) => {
          if (!heading.id) {
            heading.id = `document-section-${index}`;
            addedIds.push(heading);
          }
          return { id: heading.id, title: heading.textContent?.trim() ?? "" };
        })
        .filter((heading) => heading.title),
    );
    return () => addedIds.forEach((heading) => heading.removeAttribute("id"));
  }, [documentKey]);
  if (headings.length < 2) return null;
  return (
    <details ref={details} className="document-outline">
      <summary>
        {label} <span>{headings.length}</span>
      </summary>
      <nav aria-label={label}>
        <ol>
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(event) => {
                  const target = document.getElementById(heading.id);
                  if (!target) return;
                  event.preventDefault();
                  if (details.current) details.current.open = false;
                  target.tabIndex = -1;
                  target.focus({ preventScroll: true });
                  target.scrollIntoView({ block: "start" });
                }}
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
