import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "./context/AppContext";
import App from "./App";
import Initializer from "./Initializer";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <Initializer />
    </AppProvider>
  </React.StrictMode>
);
