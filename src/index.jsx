import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start measuring performance in your app, pass a logging function (for example: reportWebVitals(console.log)) or send to an analytics endpoint.
reportWebVitals();
