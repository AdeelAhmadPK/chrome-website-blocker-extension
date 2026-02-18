import React from 'react';
import { createRoot } from 'react-dom/client';
import BlockedPage from './BlockedPage';
import '../dashboard/index.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<BlockedPage />);
