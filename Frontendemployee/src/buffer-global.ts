/**
 * Must run before any other app code. Sets global Buffer for Web3Auth/ethers in the browser.
 * Import this first in main.tsx.
 */
import { Buffer } from "buffer";
if (typeof globalThis !== "undefined") (globalThis as any).Buffer = Buffer;
if (typeof window !== "undefined") (window as any).Buffer = Buffer;
