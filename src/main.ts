// Toast styles first so our own stylesheet can override them.
import 'vue-toastification/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast, { POSITION } from 'vue-toastification'

const app = createApp(App)

app.use(router)

// Bottom-left keeps notifications clear of the sidebar.
app.use(Toast, { position: POSITION.BOTTOM_LEFT })

app.mount('#app')
