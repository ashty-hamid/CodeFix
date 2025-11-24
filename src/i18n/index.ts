import { createI18n } from 'vue-i18n'
import en from './en.json'
import ar from './ar.json'
import ku from './ku.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    ar,
    ku,
  },
})

export default i18n

