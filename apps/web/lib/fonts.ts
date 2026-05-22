/**
 * Centralised font instances — import from here everywhere so Next.js
 * deduplicates the Google Fonts requests in the build.
 */
import { Courier_Prime, Lora, Playfair_Display } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

/** Apply this className on `<html>` to make all three CSS variables available globally. */
export const fontVariables = `${playfair.variable} ${lora.variable} ${courierPrime.variable}`;
