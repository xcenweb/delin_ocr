import App from "./App.vue"
import { createApp } from "vue"
import router from './router'
import './assets/css/global.css'
// @ts-ignore
import { VuePageStackPlugin } from 'vue-page-stack'

import vuetify from "./plugins/vuetify"
import i18n from "./plugins/i18n"

const app = createApp(App)
app.use(router)
app.use(VuePageStackPlugin, { router })
app.use(i18n)
app.use(vuetify)
app.mount("#app");