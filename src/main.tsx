/**
 * @file main.tsx
 * @role Application entry point
 * @owns React root creation, RouterProvider mounting, global stylesheet import.
 * @does-not-own Router configuration (router.tsx), context providers (App.tsx),
 *               page components, styles definitions.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/router';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
