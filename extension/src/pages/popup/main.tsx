import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import '../dashboard/index.css';
import { getStore } from '../../shared/storage/store';

// Apply theme before first paint
getStore().then((s) => {
  if (s.settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
});

const root = document.getElementById('root');
if (root) createRoot(root).render(<Popup />);
