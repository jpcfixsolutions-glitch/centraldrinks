import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
