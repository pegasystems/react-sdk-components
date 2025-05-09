// from react_root.js
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import TopLevelApp from '../src/samples/TopLevelApp';
import './common.css';

const outletElement = document.getElementById('outlet');

if (outletElement) {
  const root = createRoot(outletElement);
  root.render(
    <StrictMode>
      <BrowserRouter>
        <TopLevelApp />
      </BrowserRouter>
    </StrictMode>
  );
}
