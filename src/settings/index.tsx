import React from 'react';
import ReactDOM from 'react-dom/client';
import SettingsPage from "./settings_page";
import './settings.css'

const root = document.createElement("div")
root.className = "containerr"
document.body.appendChild(root)
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <React.StrictMode>
    <SettingsPage />
  </React.StrictMode>
);