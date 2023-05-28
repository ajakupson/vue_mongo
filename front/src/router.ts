import { createRouter, createWebHistory } from 'vue-router';
import HomeComponent from './components/HomeComponent.vue';
import AnalyticsComponent from './components/AnalyticsComponent.vue';

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: HomeComponent },
        { path: '/charts', component: AnalyticsComponent } 
    ]
})