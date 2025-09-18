import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, Dialog, ThemeProvider, createTheme } from "@mui/material";
import { AppProvider } from "./context/AppContext";
import { FilterProvider } from "./context/FilterContext";
import { DialogProvider } from "./context/DialogContext";
import App from "./App";
import Initializer from "./Initializer";

const theme = createTheme();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <FilterProvider>
          <DialogProvider>
            <App />
            <Initializer />
          </DialogProvider>
        </FilterProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);
