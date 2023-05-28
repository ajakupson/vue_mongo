<template>
    <StockTimelineComponent 
        :data="data" 
        :associative="associative" 
        :products="products"
    />
    <OOSComponent
        :data="data" 
        :associative="associative" 
        :products="products"
    />
</template>

<script lang="ts">
import StockTimelineComponent from './StockTimelineComponent.vue';
import OOSComponent from './OOSComponent.vue';
import axios from 'axios';
import { emitter } from '../eventBus';

export default {
    components: { StockTimelineComponent, OOSComponent },
    data() {
        return {
            data: [],
            associative: [],
            products: [],
        }
    },
    mounted() {
        let that = this;
        axios
            .get('http://localhost:1337/data/get', {})
            .then(function (response) {
                let data = response.data.records;
                data.sort(function(a, b) { 
                    a = new Date(a.timestamp);
                    b = new Date(b.timestamp);
                    return a > b ? 1 : a < b ? -1 : 0;
                });
                
                that.data = data;
                that.associative = that.arrToObjectConvert(data, 'product_code');
                that.products = Object.keys(that.associative);

                void emitter.emit("render-analytics-charts");
        });  
    },
    methods: {
        arrToObjectConvert: function(array, key) {
            let out = {};
            array.forEach(r => {
                if (!out[r[key]]) {
                    out[r[key]] = [];
                }

                out[r[key]].push(r);
            });

            return out;
        },
    }
}
</script>