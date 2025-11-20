import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تحويل الأرقام العربية إلى أرقام إنجليزية
 * Converts Arabic-Indic numerals (٠-٩) to Latin numerals (0-9)
 */
export function convertArabicToEnglishNumbers(value: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = value;
  arabicNumbers.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), englishNumbers[index]);
  });
  
  return result;
}
