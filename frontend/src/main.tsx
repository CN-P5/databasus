import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { createRoot } from 'react-dom/client';

import './index.css';

import App from './App.tsx';
import './shared/i18n';

dayjs.extend(utc);
dayjs.extend(relativeTime);

createRoot(document.getElementById('root')!).render(<App />);
