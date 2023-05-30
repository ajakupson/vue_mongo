<template>
    <div class="d-flex justify-content-center">
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="st-date-range-type" id="st-date-range-type-all" value="1" v-model="dateRangeType">
            <label class="form-check-label" for="st-date-range-type-all">
                All
            </label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="st-date-range-type" id="st-date-range-type-day" value="2" v-model="dateRangeType">
            <label class="form-check-label" for="st-date-range-type-day">
                Day
            </label>
            <div v-if="dateRangeType == 2">
                <select class="form-select form-select-lg ml-2" v-model="selectedDate">
                    <option v-for="date in dataDates" :value="date"> {{ date }}</option>
                </select>
            </div>
        </div>
    </div>

    <div>
        <Line
            id="stock-timelne-chart"
            :options="stockTimelineChartOpts"
            :data="stockTimelineChartData"
        />
    </div>
</template>
  
<script lang="ts">
import _ from 'lodash';
import moment from 'moment';
import { Line } from 'vue-chartjs';
import { emitter } from '../eventBus';
import productsColors from '../assets/products';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
  
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)
  
let inProgress = true;

  export default {
    name: 'BarChart',
    components: { Line },
    props: ["data", "associative", "products"],
    data() {
      return {
        dateRangeType: 1,
        selectedDate: null,
        stockTimelineChartData: {
          labels: [],
          datasets: []
        },
        stockTimelineChartOpts: {
          responsive: true,
          maintainAspectRatio: true,
          animation:{
            onProgress: function (){
                inProgress = true;
                console.log("inp2", inProgress);
            },
            onComplete: function () {
                inProgress = false;
                console.log("inp", inProgress);
            }
         },
         plugins: {
            title: {
                display: true,
                text: "Stock timeline",
                font: {
                    size: 18
                }
            }
        }
        },  
      }
    },
    mounted() {
        emitter.on("render-analytics-charts", () => {
            this.stockTimeLineGenerate();
        });
    },
    methods: {
        stockTimeLineGenerate() {
            if (this.dateRangeType == 1) {
                this.stockTimelineAll(); 
            } else {
                this.stockTimeLinePerDay(); 
            }
        },
        stockTimeLinePerDay() {
            if (!this.selectedDate) return;

            let dStart = moment(this.selectedDate, "DD/MM/YYYY");
            let dataByDate = this.data.filter(r => {
                return moment.utc(r.timestamp).format("DD/MM/YYYY") == dStart.format("DD/MM/YYYY");
            });

            let mnmx = this.getMinMaxDates(dataByDate);
            let minDate = mnmx[0];
            let dEnd = minDate.clone().endOf('day');
            let xCurrent = minDate.clone();

            let chartData = {};
            let dataSets = {};
            while (xCurrent.valueOf() <= dEnd.valueOf()) {
                let df = xCurrent.format("DD/MM/YYYY HH:mm");

                this.products.forEach(pCode => {
                    if (!chartData[pCode]) {
                        chartData[pCode] = {};
                    }

                    if (!chartData[pCode][df]) {
                        chartData[pCode][df] = {};
                        chartData[pCode][df]['roip'] = 0;
                    }

                    let pData = this.associative[pCode];
                    pData.forEach(pd => {
                        let d1 = moment.utc(pd.timestamp).format("DD/MM/YYYY HH:mm");
                        if (d1 == df) {
                            chartData[pCode][df]['roip'] = pd.roi_percentage;
                        }
                    });

                    dataSets[pCode] = {
                        label: pCode,
                        data: [],
                        backgroundColor: productsColors[pCode],
                        borderColor: productsColors[pCode]


                    };

                    for (const dt in chartData[pCode]) {
                        dataSets[pCode].data.push(chartData[pCode][dt]['roip']);
                    }
                });

                xCurrent.add(15, 'minutes');
            }

            this.stockTimelineChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            }
        },
        stockTimelineAll() {
            let mnmx = this.getMinMaxDates(this.data);
            let minDate = mnmx[0];
            let maxDate = mnmx[1];

            let xCurrent = minDate.startOf('day');
            let xEnd = maxDate.endOf('day').add(1, 'minutes');
    
            let chartData = {};
            let dataSets = {};
            while (xCurrent.valueOf() <= xEnd.valueOf()) {
                let d1 = xCurrent.clone();
                let d2 = xCurrent.clone().add(-4, 'hours');
                let df = xCurrent.format("DD/MM/YYYY HH:mm");
                
                this.products.forEach(pCode => {
                    if (!chartData[pCode]) {
                        chartData[pCode] = {};
                    }

                    if (!chartData[pCode][df]) {
                        chartData[pCode][df] = {};
                        chartData[pCode][df]['roip'] = [];
                        chartData[pCode][df]['avg'] = 0;
                    }

                    let pData = this.associative[pCode];
                    pData.forEach(pd => {
                        let d3 = moment.utc(pd.timestamp);
                        
                        if (d3.isBetween(d2, d1)) {
                            chartData[pCode][df]['roip'].push(pd.roi_percentage);
                            chartData[pCode][df]['avg'] = _.mean(chartData[pCode][df]['roip']);
                        }
                    });

                    dataSets[pCode] = {
                        label: pCode,
                        data: [],
                        backgroundColor: productsColors[pCode],
                        borderColor: productsColors[pCode]
                    };

                    for (const dt in chartData[pCode]) {
                        dataSets[pCode].data.push(chartData[pCode][dt]['avg']);
                    }
                });

                xCurrent.add(4, 'hours');
            }

            this.stockTimelineChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            };
        },
        getMinMaxDates(arr) {
            let minDate = moment().add(100, 'years');
            let maxDate = moment().add(-100, 'years');
            arr.forEach(r => {
                let rDate = moment.utc(r.timestamp);
                if (rDate.valueOf() < minDate.valueOf()) {
                    minDate = rDate.clone();
                }

                if (rDate.valueOf() > maxDate.valueOf()) {
                    maxDate = rDate.clone();
                }
            });

            return [minDate, maxDate]
        },
    },
    computed: {
        dataDates() {
            let out = Array.from(new Set(this.data.map((item: any) => moment.utc(item.timestamp).format("DD/MM/YYYY"))));
            return out;
        }
    },
    watch: {
        dateRangeType: function() {
            this.stockTimeLineGenerate();
        },
        selectedDate: function() {
            this.stockTimeLineGenerate();
        },
    }   
  }
  </script>

<style scoped>
    #stock-timelne-chart {
        width: 100% !important;
        height: 100% !important;
    }
</style>