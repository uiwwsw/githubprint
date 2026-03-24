let pendingWindowTopScroll = false;

export function scrollWindowToTopInstantly() {
  if (typeof window === "undefined") {
    return;
  }

  const html = document.documentElement;
  const body = document.body;
  const previousHtmlScrollBehavior = html.style.scrollBehavior;
  const previousBodyScrollBehavior = body.style.scrollBehavior;

  html.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  requestAnimationFrame(() => {
    html.style.scrollBehavior = previousHtmlScrollBehavior;
    body.style.scrollBehavior = previousBodyScrollBehavior;
  });
}

export function scheduleWindowTopScroll() {
  pendingWindowTopScroll = true;
}

export function consumeScheduledWindowTopScroll() {
  if (!pendingWindowTopScroll) {
    return false;
  }

  pendingWindowTopScroll = false;
  return true;
}
