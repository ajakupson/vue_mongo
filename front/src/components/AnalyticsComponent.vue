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
            associative: [] as any,
            products: [] as any,
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

<style>
    #stock-timelne-chart {
        width: 100% !important;
        height: 100% !important;
    }
    .lds-dual-ring {
        display: inline-block;
        width: 80px;
        height: 80px;
    }

    .lds-dual-ring:after {
        content: " ";
        display: block;
        width: 64px;
        height: 64px;
        margin: 8px;
        border-radius: 50%;
        border: 6px solid #646cff;
        border-color: #646cff transparent #646cff transparent;
        animation: lds-dual-ring 1.2s linear infinite;
    }

    @keyframes lds-dual-ring {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }
</style>