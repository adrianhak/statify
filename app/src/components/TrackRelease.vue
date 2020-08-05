<template>
  <div class="track-release-container">
		<portal to="Release Dates">
			<h1 class="card-title">Release Dates</h1>
		</portal>
    <release-date-chart :showGlobal="showGlobal && globalList.length != 0" :keepRatio="keepRatio" :releaseDateList="releaseDateList" :globalList="globalList"></release-date-chart>
  </div>
</template>

<script>
import ReleaseDateChart from "@/components/ReleaseDateChart";
import { mapState } from 'vuex';
import { getGlobalReleaseDates, updateReleaseDates } from '../firestoreQueries';

export default {
  props: {
		pl: null,
		showGlobal: false
  },
  data() {
    return {
      releaseDateList: [],
      totalReleaseDates: {},
      totalTracks: 0,
      playlists: [],
      followed: [],
      saved: [],
			recently: [],
			keepRatio: this.$root.mobile || this.pl
    };
  },
  components: {
    ReleaseDateChart
	},
	computed: {
		globalList() {
			return this.$store.state.globalStats.releaseDates;
		},
		...mapState({
			settings: 'settings',
			stats: 'stats',
			hasLoaded: 'hasLoaded'
		})
	},
  methods: {
    updateRecently() {
      this.recently = [];
      if (this.settings.includeRecentlyPlayed) {
        this.recently = this.stats.recentlyPlayed.releaseDates;
      }
    },
    updateSaved() {
      this.saved = [];
      if (this.settings.includeSaved) {
        this.saved = this.stats.savedTracks.releaseDates;
      }
    },
    updatePlaylists() {
      this.playlists = [];
      if (this.settings.includePlaylists) {
        this.stats.playlists.forEach(pl => {
          pl.releaseDates.forEach(releaseDate => {
            this.playlists.push(releaseDate);
          });
        });
      }
    },
    updateFollowed() {
      this.followed = [];
      if (this.settings.includeFollowed) {
        this.stats.followedPlaylists.forEach(pl => {
          pl.releaseDates.forEach(releaseDate => {
            this.followed.push(releaseDate);
          });
        });
      }
    },
    update() {
      this.releaseDateList = [];
      this.totalReleaseDates = {};
      this.totalTracks = 0;
      if (!this.pl) {
        let start = performance.now();
        // Reset for every re-render
        this.releaseDateList = [];
        this.totalReleaseDates = {};
        this.totalTracks = 0;
        let totalList = [];
				if (this.settings.includePlaylists) {
					// Need to check since component might have been created with setting turned off
					if (this.playlists.length == 0) {
						this.updatePlaylists();
					}
					totalList = this.playlists;
          this.totalTracks += this.playlists.length;
        }
				if (this.settings.includeFollowed) {
					if (this.followed.length == 0) {
						this.updateFollowed();
					}
          totalList = totalList.concat(this.followed);
          this.totalTracks += this.followed.length;
        }
				if (this.settings.includeSaved) {
					if (this.saved.length == 0) {
						this.updateSaved();
					}
          totalList = totalList.concat(this.saved);
          this.totalTracks += this.saved.length;
        }
				if (this.settings.includeRecentlyPlayed) {
					if (this.recently.length == 0) {
						this.updateRecently();
					}
          totalList = totalList.concat(this.recently);
          this.totalTracks += this.recently.length;
				}
        totalList.forEach(releaseDate => {
          if (this.totalReleaseDates.hasOwnProperty(releaseDate)) {
            this.totalReleaseDates[releaseDate]++;
          } else {
            this.totalReleaseDates[releaseDate] = 1;
          }
				});
      } else {
				if (!this.pl.isPlaceholder) {
        	// Playlist specific chart
        	this.keepRatio = true; // Keep aspect ratio in playlist-specific chart
        	this.totalTracks += this.pl.tracksAnalyzed;
        	this.pl.releaseDates.forEach(releaseDate => {
          	if (releaseDate in this.totalReleaseDates) {
            	this.totalReleaseDates[releaseDate]++;
          	} else {
            	this.totalReleaseDates[releaseDate] = 1;
          	}
					});
				}
      }
      Object.keys(this.totalReleaseDates).forEach(releaseDate => {
        const percent =
          (this.totalReleaseDates[releaseDate] / this.totalTracks) * 100;
        this.releaseDateList.push({x: releaseDate.toString(), y: percent});
      });
      this.releaseDateList.sort((a, b) => {
        return a.x - b.x;
      });
		},
		async fetchGlobalReleaseDates() {
			this.$store.commit('SET_GLOBAL_STAT',{stat:'releaseDates',
				value: await getGlobalReleaseDates()});
			return;
		}
  },
  created() {
    if (!this.pl) {
      if (this.settings.includePlaylists) {
        this.updatePlaylists();
      }
      if (this.settings.includeFollowed) {
        this.updateFollowed();
      }
      if (this.settings.includeSaved) {
        this.updateSaved();
      }
      if (this.settings.includeRecentlyPlayed) {
        this.updateRecently();
      }
    }
		this.update();
		if (!this.$store.state.isCached && !this.pl && this.$store.state.flaggedPlaylists.length == 0) {
			updateReleaseDates(this.totalReleaseDates);
		}
  },
	watch: {
		settings: {
			handler() {
				// Do not update playlist specific charts on setting toggle
				if (!this.pl && this.hasLoaded) {
					this.update();
				}
			},
			deep: true
		},
		hasLoaded: function() {
			if (this.hasLoaded && !this.pl) {
				this.update();
			}
		},
    pl() {
      this.update();
		},
		showGlobal() {
			if (this.showGlobal && this.globalList.length == 0) {
				this.fetchGlobalReleaseDates();
			}
		}
  }
};
</script>
<style>
.track-release-container .title {
  margin-bottom: 1vh;
  margin-left: 2.5vh;
  text-align: left;
  font-size: 1.25em;
}
</style>
