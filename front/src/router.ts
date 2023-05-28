import { createRouter, createWebHistory } from 'vue-router';
import HomeComponent from './components/HomeComponent.vue';
import AnalyticsComponent from './components/AnalyticsComponent.vue';
import ProductsComponent from './components/ProductsComponent.vue';
import CustomersComponent from './components/CustomersComponent.vue';

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: HomeComponent },
        { path: '/charts', component: AnalyticsComponent },
        { path: '/products', component: ProductsComponent },
        { path: '/customers', component: CustomersComponent } 
    ]
})