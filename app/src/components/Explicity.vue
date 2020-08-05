<template>
  <div class="explicity-container">
		<portal to="Explicit tracks">
			<h1 class="card-title">Explicit tracks</h1>
		</portal>
		<rating-stat 
			:rating="explicitRating" 
			:globalRating="globalRating"
			:showGlobal="showGlobal">
		</rating-stat>
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
  data() {
    return {
      explicitRating: 0,
    };
	},
	computed: {
		globalRating() {
			return this.$store.state.globalStats.explicity;
		},
		...mapState({
		settings:'settings',
		stats: 'stats',
		hasLoaded: 'hasLoaded'
		})
	},
  methods: {
    update() {
      let totalTracks = 0;
      this.explicitRating = 0;
      if (this.settings.includeSaved) {
        totalTracks += this.stats.savedTracks.tracksAnalyzed;
        this.explicitRating += this.stats.savedTracks.explicitTracks;
      }
      if (this.settings.includeRecentlyPlayed) {
        totalTracks += this.stats.recentlyPlayed.tracksAnalyzed;
        this.explicitRating += this.stats.recentlyPlayed.explicitTracks;
      }
      if (this.settings.includeFollowed) {
        this.stats.followedPlaylists.forEach((playlist) => {
          totalTracks += playlist.tracksAnalyzed;
          this.explicitRating += playlist.explicitTracks;
        });
      }
      if (this.settings.includePlaylists) {
        this.stats.playlists.forEach((playlist) => {
          totalTracks += playlist.tracksAnalyzed;
          this.explicitRating += playlist.explicitTracks;
        });
      }
      this.explicitRating = Math.round((this.explicitRating / totalTracks) * 100);
		},
		async fetchGlobalStat() {
			this.$store.commit('SET_GLOBAL_STAT',{stat:'explicity',
				value: await getGlobalRating('explicity')});
		}
  },
  created() {
		this.update();
		if (!this.$store.state.isCached && this.$store.state.flaggedPlaylists.length == 0) {
			updateGlobalStat('explicity',this.explicitRating);
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
		hasLoaded() {
			if (this.hasLoaded) {
				this.update();
			}
		},
		showGlobal() {
			if (this.showGlobal && this.globalRating == null) {
				this.fetchGlobalStat();
			}
		}
	},
};
</script>

