// Buffer polyfill for browser wallet and ethers dependencies.
import { Buffer } from "buffer";
if (typeof window !== "undefined") (window as any).Buffer = Buffer;

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
  
