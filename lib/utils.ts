import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
  if (!match) return '';
  return match[2];
}

