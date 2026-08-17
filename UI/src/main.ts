import './assets/main.css'
import router from './router';
import { initDarkMode } from './utils/darkMode';

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css'

initDarkMode();

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.p-dark',
        },
    }
});
app.directive('tooltip', Tooltip);
app.use(ToastService);
app.use(router);
app.mount('#app');
