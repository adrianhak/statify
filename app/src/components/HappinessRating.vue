<template>
	<div class="happiness-rating-container" :class="getIcon">
		<portal to="Happiness">
			<h1 class="card-title">Happiness</h1>
		</portal>
		<rating-stat
			:showGlobal="showGlobal"
			:rating="happinessRating"
			:globalRating="globalRating"
			:getIcon="getIcon"
		></rating-stat>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import { getGlobalRating, updateGlobalStat } from '../firestoreQueries';
import RatingStat from '@/components/RatingStat';
export default {
	props: {
		showGlobal: false,
	},
	data() {
		return {
			happinessRating: 0,
			happy: {'followed':0,'playlists':0,'saved':0,'recently':0},
			totalTracks: {'followed':0,'playlists':0,'saved':0,'recently':0},
		};
	},
	components: {
		RatingStat
	},
	computed: {
		getIcon() {
			if (this.happinessRating > 75) { return 'laugh'; }
			if (this.happinessRating > 60) { return 'smile'; }
			if (this.happinessRating > 40) { return 'meh'; }
			return 'frown';
		},
		globalRating() {
			return this.$store.state.globalStats.happiness;
		},
		...mapState ({
		settings: 'settings',
		stats: 'stats',
		hasLoaded: 'hasLoaded'
	})
	},
	methods: {
		updateFollowed() {
			this.happy.followed = 0;
			this.totalTracks.followed = 0;
			if (this.settings.includeFollowed) {
				this.stats.followedPlaylists.forEach((playlist) => {
					this.totalTracks.followed += playlist.tracksAnalyzed;
					Object.keys(playlist.tracks).forEach((t) => {
						if (playlist.tracks[t].features.valence >=0.5) {
							this.happy.followed += 1;
						}
					});
				});
			}
		},
		updatePlaylists() {
			this.happy.playlists = 0;
			this.totalTracks.playlists = 0;
			if (this.settings.includePlaylists) {
				this.stats.playlists.forEach((playlist) => {
					this.totalTracks.playlists += playlist.tracksAnalyzed;
					Object.keys(playlist.tracks).forEach((t) => {
						if (playlist.tracks[t].features.valence >=0.5) {
							this.happy.playlists += 1;
						}
					});
				});
			}
		},
		updateSaved() {
			this.happy.saved = 0;
			this.totalTracks.saved = 0;
			if (this.settings.includeSaved) {
				this.totalTracks.saved += this.stats.savedTracks.tracksAnalyzed;
				Object.keys(this.stats.savedTracks.tracks).forEach((t) => {
					if (this.stats.savedTracks.tracks[t].features.valence >= 0.5) {
						this.happy.saved += 1;
					}
				});
			}
		},
		updateRecently() {
			this.happy.recently = 0;
			this.totalTracks.recently = 0;
			if (this.settings.includeRecentlyPlayed) {
				this.totalTracks.recently += this.stats.recentlyPlayed.tracksAnalyzed;
				Object.keys(this.stats.recentlyPlayed.tracks).forEach((t) => {
					if (this.stats.recentlyPlayed.tracks[t].features.valence >= 0.5) {
						this.happy.recently += 1;
					}
				});
			}
		},
		update() {
			let totalTracks = 0;
			let happyTracks = 0;
			if (this.settings.includePlaylists) {
				if (this.totalTracks.playlists == 0) {
					this.updatePlaylists();
				}
				totalTracks += this.totalTracks.playlists;
				happyTracks += this.happy.playlists;
			}
			if (this.settings.includeFollowed) {
				if (this.totalTracks.followed == 0) {
					this.updateFollowed();
				}
				totalTracks += this.totalTracks.followed;
				happyTracks += this.happy.followed;
			}
			if (this.settings.includeSaved) {
				if (this.totalTracks.saved == 0) {
					this.updateSaved();
				}
				totalTracks += this.totalTracks.saved;
				happyTracks += this.happy.saved;
			}
			if (this.settings.includeRecentlyPlayed) {
				if (this.totalTracks.recently == 0) {
					this.updateRecently();
				}
				totalTracks += this.totalTracks.recently;
				happyTracks += this.happy.recently;
			}	
			this.happinessRating = Math.round((happyTracks / totalTracks) * 100);
		},
		async fetchGlobalStat() {
			this.$store.commit('SET_GLOBAL_STAT',{stat:'happiness',
				value: await getGlobalRating('happiness')});
		}
	},
	created() {
		if (this.settings.includeSaved) { this.updateSaved(); }
		if (this.settings.includeRecentlyPlayed) { this.updateRecently(); }
		if (this.settings.includeFollowed) { this.updateFollowed(); }
		if (this.settings.includePlaylists) { this.updatePlaylists(); }
		this.update();
		if (!this.$store.state.isCached && this.$store.state.flaggedPlaylists.length == 0) {
			updateGlobalStat('happiness',this.happinessRating);
		}
	},
	watch: {
		settings: {
			handler() {
				if (this.hasLoaded) {
					this.update();
				}
			},
			deep: true
		},
		hasLoaded: function() {
			if (this.hasLoaded) {
				this.update();
			}
		},
		showGlobal() {
			if (this.showGlobal && this.globalRating == null) {
				this.fetchGlobalStat();
			}
		}
	}
};
</script>
<style scoped lang="scss">
	@import '../theme.sass';
	.laugh {
		color: $laugh;
	}
	.smile {
		color: $smile;
	}
	.meh  {
		color: $meh;
	}
	.frown {
		color: $frown;
	}
</style>
