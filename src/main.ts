import App from "./App.vue"
import { createApp } from "vue"
import router from './router'
import vuetify from "./plugins/vuetify"
// @ts-ignore
import { VuePageStackPlugin } from 'vue-page-stack'
import './assets/css/global.css'

const app = createApp(App)
app.use(router)
app.use(VuePageStackPlugin, { router })
app.use(vuetify)
app.mount("#app");