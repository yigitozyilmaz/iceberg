import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'

// i18n
import tr from './i18n/locales/tr.json'
import en from './i18n/locales/en.json'

import './style.css'

const i18n = createI18n({
    legacy: false,
    locale: 'tr',
    fallbackLocale: 'en',
    messages: { tr, en }
})

const app = createApp(App)

// Use plugins
app.use(PrimeVue, { ripple: true })
app.use(ToastService)
app.use(i18n)

// Register PrimeVue components
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Button', Button)
app.component('Dialog', Dialog)
app.component('Calendar', Calendar)
app.component('InputText', InputText)
app.component('Dropdown', Dropdown)
app.component('Toast', Toast)
app.component('Tag', Tag)
app.component('Paginator', Paginator)

app.mount('#app')