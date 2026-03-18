import type { Locale } from "@/lib/schemas";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getIntlLocale(locale: Locale) {
  return locale === "ko" ? "ko-KR" : "en-US";
}

export function formatDate(date: string, locale: Locale = "ko") {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatNumber(value: number, locale: Locale = "ko") {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function getRelativeTimeLabel(date: string, locale: Locale = "ko") {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.floor((now - target) / (1000 * 60 * 60 * 24)));

  if (diffDays < 7) {
    return locale === "ko" ? "최근 일주일 내 업데이트" : "Updated within the past week";
  }
  if (diffDays < 30) {
    return locale === "ko" ? "최근 한 달 내 업데이트" : "Updated within the past month";
  }
  if (diffDays < 90) {
    return locale === "ko" ? "최근 세 달 내 업데이트" : "Updated within the past three months";
  }
  if (diffDays < 180) {
    return locale === "ko" ? "반년 내 업데이트" : "Updated within the past six months";
  }
  return locale === "ko" ? "최근 활동은 다소 이전 시점" : "Recent activity is older";
}
