import { createApp } from "vue";
import pinia from "@/stores/pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import App from "./App.vue";
import router from "./router";
import "./assets/styles/variables.less";
import "./assets/styles/global.less";
import components from "./components/index.js";

document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(components);

app.mount("#app");
