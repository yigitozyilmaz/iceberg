import { createI18n } from 'vue-i18n';
import tr from './locales/tr.json';
import en from './locales/en.json';

export default createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'tr',
    messages: {
        tr,
        en
    }
});