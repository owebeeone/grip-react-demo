import { createRoot } from 'react-dom/client';
import App from './App';
import { createWeatherRuntime } from './runtime';
import './weather.css';

const grok = createWeatherRuntime();
createRoot(document.getElementById('root')!).render(<App grok={grok} />);
