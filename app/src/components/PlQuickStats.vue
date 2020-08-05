<template>
	<div class="pl-quick-stats-container">
		<div class="pl-quickstats">
			<nav class="level is-mobile">
				<div class="level-item has-text-centered">
					<div>
						<p class="title">
							<ICountUp
								:delay=500
								:endVal=selectedPL.total
								:options={useEasing:true}
							/>
						</p>
						<p class="heading">Tracks</p>
					</div>
				</div>

				<div v-if="selectedPL.total<=selectedPL.trackCap" class="level-item has-text-centered">
					<div> 
						<p class="title">{{ totalTime }}</p>
						<p class="heading">Length</p>
					</div>
				</div>
				<div class="level-item has-text-centered">
					<div>
						<p class="title">
							<ICountUp
								:delay=500
								:endVal="Math.round(!selectedPL.isPlaceholder ? selectedPL.features.tempo : 0)"
								:options={useEasing:true}
							/>
						<p class="heading">Avg Tempo</p>
						</p>
					</div>
				</div>
				<div class="level-item has-text-centered">
					<div>
						<p class="title">
							<ICountUp
								:delay=500
								:endVal="100-Math.round((selectedPL.popularity / selectedPL.tracksAnalyzed))"
								:options={useEasing:true}
							/>%</p>
						<p class="heading">Uniqueness</p>
					</div>
				</div>
				<div class="level-item has-text-centered">
					<div>
						<p class="title">
							<ICountUp
								:delay=500
								:endVal="Math.round((selectedPL.explicitTracks / selectedPL.tracksAnalyzed) * 1000) /10"
								:options={useEasing:true}
							/>%</p>
						<p class="heading">Explicity</p>
					</div>
				</div>

			</nav>
		</div>
	</div>
</template>

<script>
import ICountUp from 'vue-countup-v2';

export default {
	props: [
		'selectedPL'
	],
	components: {
		ICountUp
	},
	computed: {
		totalTime() {
			let totalLength = 0;
			Object.keys(this.selectedPL.tracks).forEach((tKey) => {
				totalLength += Math.round(this.selectedPL.tracks[tKey].track.duration_ms / 1000);
			});
			const rawTime = Math.round(totalLength / 60);
			const hours = Math.floor(rawTime/60);
			const minutes = rawTime%60;
			if (!hours) { // xmin
				return minutes + 'min';
			}
			if (!minutes) { // xh
				return hours + 'h';
			}
			return hours + 'h ' + minutes + 'min'; // xh ymin
		}
	}
};
</script>
<style>
.level {
	overflow-x: auto;
	overflow-y: hidden;
}
</style>
