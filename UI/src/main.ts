import './assets/main.css'
import router from './router';

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';

const app = createApp(App);
app.use(PrimeVue as any); // Explicitly cast to bypass TypeScript error
app.use(router);
app.mount('#app');
