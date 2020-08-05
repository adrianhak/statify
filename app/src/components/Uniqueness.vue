<template>
	<div class="Uniqueness-container">
		<portal to="Uniqueness">
			<p class="card-title">Uniqueness</p>
		</portal>
		<rating-stat :showGlobal="showGlobal" :rating="rating" :globalRating="globalRating"></rating-stat>
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
	components: {
		RatingStat
	},
	computed: { 
		globalRating() {
			return this.$store.state.globalStats.uniqueness
		},
		...mapState({
			settings: 'settings',
			stats: 'stats',
			hasLoaded: 'hasLoaded',
		})
	},
	data() {
		return {
			popCounter: [],
			savedPopCounter: [],
			recentlyPopCounter: [],
			followedPopCounter: [],
			playlistPopCounter: [],
			rating: null,
		};
	},
	methods: {
		avg(data) {
			const totalPop = data.reduce((a, b) => a + b, 0);
			return Math.round(100 - (totalPop / data.length));
		},
		updateSaved() {
			this.savedPopCounter = [];
			if (this.settings.includeSaved) {
				Object.keys(this.stats.savedTracks.tracks).forEach((track) => {
					this.savedPopCounter.push(parseInt(this.stats.savedTracks.tracks[track].track.popularity));
				});
			}
		},
		updateRecently() {
			this.recentlyPopCounter = [];
			if (this.settings.includeRecentlyPlayed) {
				Object.keys(this.stats.recentlyPlayed.tracks).forEach((track) => {
					this.recentlyPopCounter.push(parseInt(this.stats.recentlyPlayed.tracks[track].track.popularity));
				});
			}
		},
		updateFollowed() {
			this.followedPopCounter = [];
			if (this.settings.includeFollowed) {
				this.stats.followedPlaylists.forEach((pl) => {
					Object.keys(pl.tracks).forEach((track) => {
						this.followedPopCounter.push(parseInt(pl.tracks[track].track.popularity));
					});
				});
			}
		},
		updatePlaylists() {
			this.playlistPopCounter = [];
			if (this.$store.state.settings.includePlaylists) {
				this.stats.playlists.forEach((pl) => {
					Object.keys(pl.tracks).forEach((track) => {
						this.playlistPopCounter.push(parseInt(pl.tracks[track].track.popularity));
					});
				});
			}
		},
		update() {
			this.popCounter = [];
			if (this.settings.includePlaylists) {
				if (this.playlistPopCounter.length == 0) {
					this.updatePlaylists();
				}
				this.popCounter = this.playlistPopCounter;
			}
			if (this.settings.includeFollowed) {
				if (this.followedPopCounter.length == 0) {
					this.updateFollowed();
				}
				this.popCounter = this.popCounter.concat(this.followedPopCounter);
			}
			if (this.settings.includeSaved) {
				if (this.savedPopCounter.length == 0) {
					this.updateSaved();
				}
				this.popCounter = this.popCounter.concat(this.savedPopCounter);
			}
			if (this.settings.includeRecentlyPlayed) {
				if (this.recentlyPopCounter.length == 0) {
					this.updateRecently();
				}
				this.popCounter = this.popCounter.concat(this.recentlyPopCounter);
			}
			this.rating = this.avg(this.popCounter);
		},
		// Get data from Firestore
		async fetchGlobalStats() {
			this.$store.commit('SET_GLOBAL_STAT',{stat:'uniqueness',
				value: await getGlobalRating('uniqueness')});
		}
	},
	created() {
		if (this.settings.includeSaved) { this.updateSaved(); }
		if (this.settings.includeRecentlyPlayed) { this.updateRecently(); }
		if (this.settings.includeFollowed) { this.updateFollowed(); }
		if (this.settings.includePlaylists) { this.updatePlaylists(); }
		this.update();
		// If state is fresh and fetch complete, update the global averages
		if (!this.$store.state.isCached && this.$store.state.flaggedPlaylists.length == 0) {
			updateGlobalStat('uniqueness',this.rating);
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
			// Only fetch if globalRating is not already set
			if (this.showGlobal && this.globalRating == null) {
				this.fetchGlobalStats();
			}
		}
	}
};
</script>
