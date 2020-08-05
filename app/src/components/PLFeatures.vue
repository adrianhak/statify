<template>
  <div class="pl-features-container">
    <p-l-features-chart :featureOrder="featureOrder" :features="featureList"></p-l-features-chart>
  </div>
</template>

<script>
import PLFeaturesChart from '@/components/PLFeaturesChart';
export default {
    props: {
      pl: null,
		},
		data() {
			return {
				featureOrder: ['danceability','energy','speechiness','liveness',
											 'acousticness','happiness']
			}
		},
    components: {
      PLFeaturesChart,
		},
		computed: {
			featureList() {
				if (this.pl.isPlaceholder) {
					return null;
				}
				let temp = [];
				this.featureOrder.forEach(feat => {
					feat = feat == 'happiness' ? 'valence' : feat;
					temp.push(this.pl.features[feat]);
				});
				return temp;
			}
		},
}
</script>
<style>
	.pl-features-container {
		margin-left: 0.5em;
		margin-right: 0.5em;
		flex-grow: 1;
	}
</style>
