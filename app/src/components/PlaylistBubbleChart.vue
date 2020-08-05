<script>
import { Bubble } from 'vue-chartjs';

export default {
  props: {
		keepRatio: false,
    plDatasets: null,
  },
  methods: {
    createChart(data) {
      if (this.$data._chart) { // Clear everything on re-render
        this.$data._chart.destroy();
      }
      this.renderChart({
        datasets: data,
        hoverRadius: 0,
      },
      {
        responsive: true,
        maintainAspectRatio: this.keepRatio,
				legend: { display: false },
				scales: {
					xAxes: [{
						ticks: {fontColor: "#FD797A"}
					
					}],
					yAxes: [{ticks: {fontColor: "#378FC8"}}]
				},
				tooltips: {
					callbacks: {
						title: ((tooltipItems, data) => {
							return data.datasets[tooltipItems[0].datasetIndex].label
						}),
						label: ((tooltipItem, data) => {
							let label = [];
							label.push('x: '+Math.round(tooltipItem.xLabel*10)/10);
							label.push('y: '+Math.round(tooltipItem.yLabel*10)/10);
							return label;
						})

					}
				}
      },
      );
      /* eslint-enable */
    },
  },
  extends: Bubble,
  mounted() {
    this.createChart(this.plDatasets);
  },
  // Required to re-render chart on prop change
  watch: {
    plDatasets() {
			this.$data._chart.data.datasets = this.plDatasets;
			this.$data._chart.update();
    },
  },
};
</script>
