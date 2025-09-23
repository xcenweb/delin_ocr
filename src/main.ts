import App from "./App.vue"
import { createApp } from "vue"
import router from './router'
import vuetify from "./plugins/vuetify"
import './assets/css/global.css'
// @ts-ignore
import { VuePageStackPlugin } from 'vue-page-stack'

const app = createApp(App)
app.use(router)
app.use(VuePageStackPlugin, { router })
app.use(vuetify)
app.mount("#app");