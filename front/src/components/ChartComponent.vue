<template>
    <div class="form-check">
        <input class="form-check-input" type="radio" name="date-range-type" id="date-range-type-day" value="2" v-model="dateRangeType">
        <label class="form-check-label" for="date-range-type-day">
            Day
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="radio" name="date-range-type" id="date-range-type-all" value="1" v-model="dateRangeType">
        <label class="form-check-label" for="date-range-type-all">
            All
        </label>
    </div>

    <div v-if="dateRangeType == 2">
        <select class="form-select" v-model="selectedDate">
            <option v-for="(date, index) in dataDates" :value="date"> {{ date }}</option>
        </select>
    </div>

    <div v-show="processing" class="lds-dual-ring"></div>

    <div v-if="!processing">
        <Line
            id="stock-timelne-chart"
            :options="stockTimelineChartOpts"
            :data="stockTimelineChartData"
        />
    </div>

    <div v-if="!processing">
        <Bar
            id="oos-chart"
            :options="oosChartOpts"
            :data="oosChartData"
        />
    </div>
</template>
  
<script lang="ts">
import _ from 'lodash';
import axios from 'axios'
import moment from 'moment';
import { Line, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js'
  
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
)
  
  export default {
    name: 'BarChart',
    components: { Line, Bar },
    data() {
      return {
        dateRangeType: 1,
        selectedDate: null,
        data: [],
        dataAssoc: [],
        products: [],
        stockTimelineChartData: {
          labels: [],
          datasets: []
        },
        stockTimelineChartOpts: {
          responsive: true,
          maintainAspectRatio: true
        },
        oosChartData: {
            labels: [],
            datasets: []
        },
        oosChartOpts: {
          responsive: true,
          maintainAspectRatio: true
        },
        processing: true
      }
    },
    mounted() {
        let that = this;
        axios
            .get('http://localhost:1337/data/get', {})
            .then(function (response) {
                that.processing = true;
                let data = response.data.records;
                data.sort(function(a, b) { 
                    a = new Date(a.timestamp);
                    b = new Date(b.timestamp);
                    return a > b ? 1 : a < b ? -1 : 0;
                });
                
                that.data = data;
                that.dataAssoc = that.arrToObjectConvert(data, 'product_code');
                that.products = Object.keys(that.dataAssoc);
                that.generateCharts();
        });  
    },
    methods: {
        stockTimeLineGenerate() {
            if (this.dateRangeType == 2) {
                this.stockTimeLinePerDay();
            } else {
                this.stockTimelineAll(); 
            }
        },
        stockTimeLinePerDay() {
            if (!this.selectedDate) return;

            let dStart = moment(this.selectedDate, "DD/MM/YYYY");
            let filteredByDate = this.data.filter(r => {
                return moment.utc(r.timestamp).format("DD/MM/YYYY") == dStart.format("DD/MM/YYYY");
            });


            let minDate = moment().add(99, 'years');
            filteredByDate.forEach(r => {
                let rDate = moment.utc(r.timestamp);
                if(rDate.valueOf() < minDate.valueOf()) {
                    minDate = rDate.clone();
                }
                
            });

            let dEnd = minDate.clone().endOf('day');

            let xCurrent = minDate.clone();
            let chartData = {};
            while (xCurrent.valueOf() < dEnd.valueOf()) {
                let df = moment(xCurrent).format("DD/MM/YYYY HH:mm");
                this.products.forEach(p => {
                    if (!chartData[p]) {
                        chartData[p] = {};
                    }

                    if (!chartData[p][df]) {
                        chartData[p][df] = {};
                        chartData[p][df]['roip'] = 0;
                    }
                });
                xCurrent.add(15, 'minutes');
            }


            for (const pCode in chartData) {
                for (const dt in chartData[pCode]) {
                    let pData = this.dataAssoc[pCode];
                    pData.forEach(pd => {
                        let d1 = moment(dt, "DD/MM/YYYY HH:mm").format("DD/MM/YYYY HH:mm");
                        let d2 = moment.utc(pd.timestamp).format("DD/MM/YYYY HH:mm");
                        
                        if (d1 == d2) {
                            chartData[pCode][dt]['roip'] = pd.roi_percentage;
                        }
                    });
                }
            }

            let dataSets = {};
            for(const pCode in chartData) {
                dataSets[pCode] = {
                    label: pCode,
                    data: [],
                    backgroundColor: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')

                };
                for (const dt in chartData[pCode]) {
                    dataSets[pCode].data.push(chartData[pCode][dt]['roip']);
                }
            }

            this.stockTimelineChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            }
        },
        stockTimelineAll() {
            let dStart = moment.utc(this.data[0].timestamp).format("DD/MM/YYYY");
            let dEnd = moment.utc(this.data[this.data.length - 1].timestamp).format("DD/MM/YYYY");

            let xCurrent = moment(dStart, "DD/MM/YYYY");
            let xEnd = moment(dEnd, "DD/MM/YYYY HH:mm");
            xEnd.add(1, 'days');
    
            let chartData = {};
            while (xCurrent.valueOf() < xEnd.valueOf()) {
                let df = moment(xCurrent).format("DD/MM/YYYY HH:mm");
                this.products.forEach(p => {
                    if (!chartData[p]) {
                        chartData[p] = {};
                    }

                    if (!chartData[p][df]) {
                        chartData[p][df] = {};
                        chartData[p][df]['roip'] = [];
                        chartData[p][df]['avg'] = 0;
                    }
                });
                xCurrent.add(4, 'hours');
            }

            for (const pCode in chartData) {
                for (const dt in chartData[pCode]) {
                    let pData = this.dataAssoc[pCode];
                    pData.forEach(pd => {
                        let d1 = moment(dt, "DD/MM/YYYY HH:mm");
                        let d2 = moment(dt, "DD/MM/YYYY HH:mm").add(-4, 'hours');
                        let d3 = moment.utc(pd.timestamp);
                        
                        if (d3.isBetween(d2, d1)) {
                            chartData[pCode][dt]['roip'].push(pd.roi_percentage);
                            chartData[pCode][dt]['avg'] = _.mean(chartData[pCode][dt]['roip']);
                        }
                    });
                }
            }

            let dataSets = {};
            for(const pCode in chartData) {
                dataSets[pCode] = {
                    label: pCode,
                    data: [],
                    backgroundColor: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')

                };
                for (const dt in chartData[pCode]) {
                    dataSets[pCode].data.push(chartData[pCode][dt]['avg']);
                }
            }

            this.stockTimelineChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            };
        },
        topOOSGenerate() {
            if (this.dateRangeType == 2) {
                this.topOOSGeneratePerDay();
            } else {
                this.topOOSGenerateAll(); 
            }
        },
        topOOSGeneratePerDay() {
            if (!this.selectedDate) return;

            let dStart = moment(this.selectedDate, "DD/MM/YYYY");
            let filteredByDate = this.data.filter(r => {
                return moment.utc(r.timestamp).format("DD/MM/YYYY") == dStart.format("DD/MM/YYYY");
            });


            let minDate = moment().add(99, 'years');
            filteredByDate.forEach(r => {
                let rDate = moment.utc(r.timestamp);
                if(rDate.valueOf() < minDate.valueOf()) {
                    minDate = rDate.clone();
                }
                
            });

            let dEnd = minDate.clone().endOf('day');

            let xCurrent = minDate.clone();
            let chartData = {};
            while (xCurrent.valueOf() < dEnd.valueOf()) {
                let df = moment(xCurrent).format("DD/MM/YYYY HH:mm");
                this.products.forEach(p => {
                    if (!chartData[p]) {
                        chartData[p] = {};
                    }

                    if (!chartData[p][df]) {
                        chartData[p][df] = {};
                        chartData[p][df]['cumulative_oos'] = 0;
                    }
                });
                xCurrent.add(15, 'minutes');
            }


            for (const pCode in chartData) {
                for (const dt in chartData[pCode]) {
                    let pData = this.dataAssoc[pCode];
                    pData.forEach(pd => {
                        let d1 = moment(dt, "DD/MM/YYYY HH:mm").format("DD/MM/YYYY HH:mm");
                        let d2 = moment.utc(pd.timestamp).format("DD/MM/YYYY HH:mm");
                        
                        if (d1 == d2 && pd.roi_state == "oos") {
                            chartData[pCode][dt]['cumulative_oos']++;
                        }
                    });
                }
            }

            let dataSets = {};
            for(const pCode in chartData) {
                dataSets[pCode] = {
                    label: pCode,
                    data: [],
                    backgroundColor: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')

                };
                for (const dt in chartData[pCode]) {
                    dataSets[pCode].data.push(chartData[pCode][dt]['cumulative_oos']);
                }
            }

            this.oosChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            }
        },
        topOOSGenerateAll() {
            let dStart = moment.utc(this.data[0].timestamp).format("DD/MM/YYYY");
            let dEnd = moment.utc(this.data[this.data.length - 1].timestamp).format("DD/MM/YYYY");

            let xCurrent = moment(dStart, "DD/MM/YYYY");
            let xEnd = moment(dEnd, "DD/MM/YYYY HH:mm");
            xEnd.add(1, 'days');
    
            let chartData = {};
            while (xCurrent.valueOf() < xEnd.valueOf()) {
                let df = moment(xCurrent).format("DD/MM/YYYY HH:mm");
                this.products.forEach(p => {
                    if (!chartData[p]) {
                        chartData[p] = {};
                    }

                    if (!chartData[p][df]) {
                        chartData[p][df] = {};
                        chartData[p][df]['roip'] = [];
                        chartData[p][df]['avg'] = 0;
                        chartData[p][df]['cumulative_oos'] = 0;
                    }
                });
                xCurrent.add(4, 'hours');
            }

            for (const pCode in chartData) {
                for (const dt in chartData[pCode]) {
                    let pData = this.dataAssoc[pCode];
                    pData.forEach(pd => {
                        let d1 = moment(dt, "DD/MM/YYYY HH:mm");
                        let d2 = moment(dt, "DD/MM/YYYY HH:mm").add(-4, 'hours');
                        let d3 = moment.utc(pd.timestamp);
                        

                        if (d3.isBetween(d2, d1)) {
                            chartData[pCode][dt]['roip'].push(pd.roi_percentage);
                            chartData[pCode][dt]['avg'] = _.mean(chartData[pCode][dt]['roip']);
                        }
                    });
                }
            }

            let dataSets = {};
            for(const pCode in chartData) {
                dataSets[pCode] = {
                    label: pCode,
                    data: [],
                    backgroundColor: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')

                };
                for (const dt in chartData[pCode]) {
                    if (chartData[pCode][dt]['avg'] < 0.3) {
                        console.log(pCode, dt, chartData[pCode][dt]['avg']);
                        chartData[pCode][dt]['cumulative_oos']++;
                    }

                    dataSets[pCode].data.push(chartData[pCode][dt]['cumulative_oos']);
                }
            }

            this.oosChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            };
        },
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
        generateCharts() {
            this.processing = true;

            this.stockTimeLineGenerate();
            this.topOOSGenerate();
            
            this.processing = false;
        }
    },
    computed: {
        dataDates() {
            let out = Array.from(new Set(this.data.map((item: any) => moment.utc(item.timestamp).format("DD/MM/YYYY"))));
            return out;
        }

    },
    watch: {
        dateRangeType: function(nv, ov) {
            this.generateCharts();
        },
        selectedDate: function(nv, ov) {
            this.generateCharts();
        },
    }   
  }
  </script>

  <style>
    #stock-timelne-chart {
        width: 100% !important;
        height: 100% !important;
    }
    #oos-chart {
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