import React from "react";
import ReactDOM from "react-dom/client";
import ProvedorAvisos from "./components/ProvedorAvisos";
import App from "./App";
import AuthProvider from "./auth/AuthProvider";
import { BrowserRouter } from "react-router-dom";
import "./styles/responsivo.css";
import "./styles/tipografia.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ProvedorAvisos>
        <App />
      </ProvedorAvisos>
    </AuthProvider>
  </BrowserRouter>
)
