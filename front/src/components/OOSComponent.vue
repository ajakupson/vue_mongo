<template>
    <div class="d-flex justify-content-center mt-3">
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="oos-date-range-type" id="oos-date-range-type-all" value="1" v-model="dateRangeType">
            <label class="form-check-label" for="oos-date-range-type-all">
                All
            </label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="oos-date-range-type" id="oos-date-range-type-day" value="2" v-model="dateRangeType">
            <label class="form-check-label" for="oos-date-range-type-day">
                Day
            </label>
        </div>

        <div v-if="dateRangeType == 2">
            <select class="form-select form-select-lg ml-2" v-model="selectedDate">
                <option v-for="date in dataDates" :value="date"> {{ date }}</option>
            </select>
        </div>
    </div>

    <div>
        <Bar
            id="oos-chart"
            :options="oosChartOpts"
            :data="oosChartData"
        />
    </div>
</template>
  
<script lang="ts">
import _ from 'lodash';
import moment from 'moment';
import { Line, Bar } from 'vue-chartjs';
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
    components: { Bar },
    props: ["data", "associative", "products"],
    data() {
      return {
        dateRangeType: 1,
        selectedDate: null,
        oosChartData: {
            labels: [],
            datasets: []
        },
        oosChartOpts: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            title: {
                display: true,
                text: "OOS",
                font: {
                    size: 18
                }
            }
        }
        }
      }
    },
    mounted() {
        emitter.on("render-analytics-charts", () => {
            this.topOOSGenerate();
        });
    },
    methods: {
        topOOSGenerate() {
            if (this.dateRangeType == 1) {
                this.topOOSGenerateAll();
            } else {
                this.topOOSGeneratePerDay(); 
            }
        },
        topOOSGeneratePerDay() {
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
                        chartData[pCode][df]['oos'] = "no-data";
                    }

                    let pData = this.associative[pCode];
                    pData.forEach(pd => {
                        let d1 = moment.utc(pd.timestamp).format("DD/MM/YYYY HH:mm");
                        
                        if (d1 == df) {
                            chartData[pCode][df]['oos'] = pd.roi_state;
                        }
                    });

                    for (const pCode in chartData) {
                        dataSets[pCode] = {
                            label: pCode,
                            data: [],
                            backgroundColor: productsColors[pCode],
                            borderColor: productsColors[pCode]
                        };

                        let cumulativeStartDt = "";
                        let cumulativeEndDt = "";
                        for (const dt in chartData[pCode]) {
                            let duration = 0;
                            if (chartData[pCode][dt]['oos'] == "oos") {
                                if (!cumulativeStartDt) {
                                    cumulativeStartDt = dt;
                                }
                            }
 
                            if (cumulativeStartDt) {
                                cumulativeEndDt = dt;
                                let d1 = moment(cumulativeStartDt, "DD/MM/YYYY HH:mm");
                                let d2 = moment(cumulativeEndDt, "DD/MM/YYYY HH:mm");
                                let difference = moment.duration(d2.diff(d1));
                                duration = (difference.hours() * 60 + difference.minutes()) / 60;

                                if (!["oos", "no-data"].includes(chartData[pCode][dt]["oos"])) {
                                    cumulativeStartDt = "";
                                }
                                cumulativeEndDt = "";
                            }

                            dataSets[pCode].data.push(duration);
                        }
                    }
                });

                xCurrent.add(15, 'minutes');
            }

            this.oosChartData = {
                labels: Object.keys(Object.values(chartData)[0]),
                datasets: Object.values(dataSets)
            }
        },
        topOOSGenerateAll() {
            let mnmx = this.getMinMaxDates(this.data);
            let minDate = mnmx[0];
            let maxDate = mnmx[1];

            let xCurrent = minDate.startOf('day');
            let xEnd = maxDate.endOf('day').add(1, 'minutes');
    
            let chartData = {};
            let dataSets = {};
            while (xCurrent.valueOf() < xEnd.valueOf()) {
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
                        chartData[pCode][df]['oos'] = "no-data";
                    }

                    let pData = this.associative[pCode];
                    pData.forEach(pd => {
                        let d3 = moment.utc(pd.timestamp);
                        
                        if (d3.isBetween(d2, d1)) {
                            chartData[pCode][df]['roip'].push(pd.roi_percentage);
                            chartData[pCode][df]['avg'] = _.mean(chartData[pCode][df]['roip']);
                        }
                    });

                    for (const pCode in chartData) {
                        dataSets[pCode] = {
                            label: pCode,
                            data: [],
                            backgroundColor: productsColors[pCode],
                            borderColor: productsColors[pCode]
                        };

                        let cumulativeStartDt = "";
                        let cumulativeEndDt = "";
                        for (const dt in chartData[pCode]) {
                            let duration = 0;
                            if (chartData[pCode][dt]['avg'] < 0.3) {
                                if (!cumulativeStartDt) {
                                    cumulativeStartDt = dt;
                                }
                            } 
                            
                            if (cumulativeStartDt) {
                                cumulativeEndDt = dt;
                                let d1 = moment(cumulativeStartDt, "DD/MM/YYYY HH:mm");
                                let d2 = moment(cumulativeEndDt, "DD/MM/YYYY HH:mm");
                                let difference = moment.duration(d2.diff(d1));
                                duration = (difference.hours() * 60 + difference.minutes()) / 60;

                                if (chartData[pCode][dt]["avg"] > 0.3) {
                                    cumulativeStartDt = "";
                                }
                                cumulativeEndDt = "";
                            }

                            dataSets[pCode].data.push(duration);
                        }
                    }
                });

                xCurrent.add(4, 'hours');
            }

            this.oosChartData = {
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
        }
    },
    computed: {
        dataDates() {
            let out = Array.from(new Set(this.data.map((item: any) => moment.utc(item.timestamp).format("DD/MM/YYYY"))));
            return out;
        }

    },
    watch: {
        dateRangeType: function() {
            this.topOOSGenerate();
        },
        selectedDate: function() {
            this.topOOSGenerate();
        },
    }   
  }
  </script>

  <style scoped>
    #oos-chart {
        width: 100% !important;
        height: 100% !important;
    }
</style>