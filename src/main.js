import { createApp } from 'vue'
import PrimeVue from 'primevue/config';
import App from './App.vue'

// PrimeVue stil dosyaları
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import './style.css'

const app = createApp(App);

// PrimeVue kurulumu
app.use(PrimeVue, {
    ripple: true,
    inputStyle: "filled"
});

app.mount('#app');