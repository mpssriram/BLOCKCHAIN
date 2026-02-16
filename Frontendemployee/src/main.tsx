// Must be first so Buffer is defined before Web3Auth/ethers load
import "./buffer-global";

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
  