import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import LoginWrapper from './LoginWrapper.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginWrapper>
      <App />
    </LoginWrapper>
  </StrictMode>,
);
