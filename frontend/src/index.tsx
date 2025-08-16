import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AppProvider } from "./context/AppContext";
import { FilterProvider } from "./context/FilterContext";
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
          <App />
          <Initializer />
        </FilterProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);
