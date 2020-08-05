<script>
import { Radar } from 'vue-chartjs';
export default {
  props: {
		featureOrder: null,
    features: null,
  },
  methods: {
		createChart() {
			if (this.$data._chart) { // Clear everything on re-render
				this.$data._chart.destroy();
			}
			this.renderChart({
				labels: this.featureOrder,
				datasets: [{
					data: this.features,
					backgroundColor: 'rgba(191, 97, 176,0.75)',
				}],
			},
				{
					responsive: true,
					maintainAspectRatio: true,
					legend: { display: false },
					scale: {
						ticks: {
							suggestedMax: 1
						},
					},
					tooltips: {
						callbacks: {
							title: ((tooltipItems, data) => {
								return data.labels[tooltipItems[0].index]
							}),
							label: ((tooltipItem, data) => {
								return Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100) + '%';
							})
						}
					}
				});
		}
	},
  extends: Radar,
  mounted() {
    this.createChart();
  },
  watch: {
    features() {
			this.$data._chart.data.datasets[0].data = this.features; 
			this.$data._chart.update();
    }
  }
}
</script>
