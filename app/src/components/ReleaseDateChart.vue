<script>
import { Bar } from 'vue-chartjs';

export default {
  extends: Bar,
  props: {
    releaseDateList: null,
		globalList: null,
		showGlobal: false,
    keepRatio: false,
  },
  methods: {
    createChart() {
      if (this.$data._chart) { // Clear everything on re-render
        this.$data._chart.destroy();
      }
      this.renderChart({
        datasets: [{
					data: this.releaseDateList,
					backgroundColor: 'rgba(0, 0, 0, 0.65)', 
				}
				],
      },
      {
				elements: {
					line: {
						tension: 0
					}
				},
        responsive: true,
        maintainAspectRatio: this.keepRatio,
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: '% of tracks',
						},
						ticks: {
							beginAtZero: true
						}
          }],
					xAxes: [{
						type: 'time',
						stacked: true,
						time: {
							unit: 'year'
						}
					}]
				},
				tooltips: {
        	callbacks: {
          	label: function(tooltipItem, data) {
            	var label = data.datasets[tooltipItem.datasetIndex].label || '';
              if (label) {
              	label += ': ';
              }
              label += Math.round(tooltipItem.yLabel * 10) / 10;
              return label+"%";
            }
          }
        },
        legend: { display: false },
				plugins: {
					labels: false
				}
      });
    },
		minMaxValues() {
			let min = 0;
			let max = 0;
			if (this.$data._chart.data.datasets.length > 1) {
				// Global list exists but is not shown
				if (this.$data._chart.data.datasets[1].hidden) {
					min = this.releaseDateList[0].x;
					max = this.releaseDateList[this.releaseDateList.length-1].x
				} else if (this.releaseDateList.length == 0) {
				// Global list is shown, user list not shown
					min = this.globalList[0].x;
					max = this.globalList[this.globalList.length-1].x
				} else {
				// Global list is shown, user list is shown
					min = Math.min(this.globalList[0].x,this.releaseDateList[0].x).toString();
					max = Math.max(this.globalList[this.globalList.length-1].x,this.releaseDateList[this.releaseDateList.length-1].x).toString();
				}
			} else {
				// Only user list present
				min = this.releaseDateList[0].x;
				max = this.releaseDateList[this.releaseDateList.length-1].x;
			}
			return [min,max];
		}
	},
  mounted() {
    this.createChart();
  },
  watch: {
    releaseDateList() {
			this.$data._chart.data.datasets[0].data = this.releaseDateList;
			this.$data._chart.options.scales.xAxes[0].ticks.min = this.minMaxValues[0];
			this.$data._chart.options.scales.xAxes[0].ticks.max = this.minMaxValues[1];
			this.$data._chart.update();
		},
		showGlobal() {
			if (this.showGlobal) {
				if (this.$data._chart.data.datasets.length == 1) {
					this.$data._chart.data.datasets.push({
						data: this.globalList,
						backgroundColor: 'rgba(191, 97, 176, 0.7)',
					});
				}
				this.$data._chart.data.datasets[1].hidden = false;
			} else {
				this.$data._chart.data.datasets[1].hidden = true;
			}
			this.$data._chart.options.scales.xAxes[0].ticks.min = this.minMaxValues[0];
			this.$data._chart.options.scales.xAxes[0].ticks.max = this.minMaxValues[1];
			this.$data._chart.update();
		}
  },
};
</script>
