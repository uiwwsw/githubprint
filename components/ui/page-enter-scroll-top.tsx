"use client";

import { useLayoutEffect } from "react";
import {
  consumeScheduledWindowTopScroll,
  scrollWindowToTopInstantly,
} from "@/lib/instant-scroll";

export function PageEnterScrollTop() {
  useLayoutEffect(() => {
    if (!consumeScheduledWindowTopScroll()) {
      return;
    }

    scrollWindowToTopInstantly();
  }, []);

  return null;
}
