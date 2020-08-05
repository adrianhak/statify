<template>
    <div class="playlist-comparison-container">
			<portal to="Playlist comparison">
			<h1 class="card-title compare-title">Compare playlists by <br v-if="$root.mobile"/>
          <div class="dropdown is-active" @mouseover="firstActive=true" @mouseleave="firstActive=false">
            <div class="dropdown-trigger">
              <span aria-controls="dropdown-menu" class="compare-1">
								{{ selectedFeature1 == 'valence' ? 'happiness' : selectedFeature1 }}
								<font-awesome-icon icon="caret-down"></font-awesome-icon>
							</span>
            </div>
						<transition name="featureSlide">
            <div v-show="firstActive" class="dropdown-menu" role="menu">
              <div class="dropdown-content">
                <div v-for=" (feature, index) in stats.features"
                :key="index" @click="selectFeature1(feature)"
                class="dropdown-item" v-if="selectedFeature1 != feature">
                  <div class="title compare-1">{{ feature == 'valence' ? 'happiness' : feature }}</div>
                </div>
              </div>
						</div>
					</transition>
          </div>
          and
          <div class="dropdown is-active" @mouseover="secondActive=true" @mouseleave="secondActive=false">
            <div class="dropdown-trigger">
              <span aria-controls="dropdown-menu" class="compare-2">
								{{ selectedFeature2  == 'valence' ? 'happiness' : selectedFeature2}}
								<font-awesome-icon icon="caret-down"></font-awesome-icon>
              </span>
						</div>
						<transition name="featureSlide">
            <div v-show="secondActive" class="dropdown-menu" id="dropdown-menu" role="menu">
              <div class="dropdown-content">
                <div v-for=" (feature, index) in stats.features"
                :key="index" @click="selectFeature2(feature)"
                class="dropdown-item" v-if="selectedFeature2 != feature">
                  <h1 class="title compare-2"> {{ feature == 'valence' ? 'happiness' : feature }}</h1>
                </div>
              </div>
						</div>
					</transition>
          </div>
				</h1>
			</portal>
        <playlist-bubble-chart class="chart"
        :plDatasets="plDatasets" :keepRatio="keepRatio"></playlist-bubble-chart>
    </div>
</template>


<script>
import PlaylistBubbleChart from '@/components/PlaylistBubbleChart';
import { mapState } from 'vuex';
export default {
  data() {
    return {
			plDatasets: [],
			featureList: [
				'danceability',
				'energy',
				'speechiness',
				'acousticeness',
				'instrumentalness',
				'liveness',
				'tempo',
				'valence',
				'explicity'],
			totalTracks: 0,
			firstActive: false,
			secondActive: false,
      selectedFeature1: null,
      selectedFeature2: null,
    };
  },
  components: {
    PlaylistBubbleChart,
	},
	computed: {
		keepRatio() {
			return this.$root.mobile;
		},
		...mapState( {
			settings: 'settings',
			stats: 'stats',
			hasLoaded: 'hasLoaded'
	})},
  methods: {
    getRandomColor(id) {
			// Generates a color based on the sum of all charcodes in the playli:t name
			let stringVal = id.split('').reduce((sum,val) => sum+val.charCodeAt(0),0);
			return 'rgba(' +(stringVal)%255+ ',' +((stringVal*7)+50)%255+ ',' +((stringVal*13)+100)%255+ ',' +'0.5)';
    },
    getRandomFeatures() {
      let rand = Math.floor(Math.random() * this.featureList.length);
      this.selectedFeature1 = this.featureList[rand];
      // Makes sure the two features are different
      this.selectedFeature2 = this.selectedFeature1;
      while (this.selectedFeature1 === this.selectedFeature2) {
        rand = Math.floor(Math.random() * this.featureList.length);
        this.selectedFeature2 = this.featureList[rand];
      }
    },
    createDataset() {
			this.firstActive = false;
			this.secondActive = false; // Force close to fix issue with touch devices not playing nicely with @mouseover
			this.plDatasets = [];
			this.totalTracks = 0;
			if (this.settings.includeFollowed) {
				for (let i = 0; i < Math.min(10,this.stats.followedPlaylists.length); i += 1) {
					this.totalTracks += this.stats.followedPlaylists[i].total;
          this.stats.followedPlaylists[i].features.explicity =
						this.stats.followedPlaylists[i].explicitTracks 
						/ this.stats.followedPlaylists[i].tracksAnalyzed;
          this.plDatasets.push(
            { label: this.stats.followedPlaylists[i].name,
              backgroundColor: this.getRandomColor(this.stats.followedPlaylists[i].id),
              data: [{
                x: this.stats.followedPlaylists[i].features[this.selectedFeature1],
                y: this.stats.followedPlaylists[i].features[this.selectedFeature2],
								r: Math.min(35, (this.stats.followedPlaylists[i].total / (this.totalTracks/150))),
              }],
            });
        }        
      }
			if (this.settings.includePlaylists) {
				for (let i = 0; i < Math.min(10,this.stats.playlists.length); i += 1) {
					this.totalTracks += this.stats.playlists[i].total;
          this.stats.playlists[i].features.explicity =
          this.stats.playlists[i].explicitTracks / this.stats.playlists[i].tracksAnalyzed;
          this.plDatasets.push(
            { label: this.stats.playlists[i].name,
              backgroundColor: this.getRandomColor(this.stats.playlists[i].id),
              data: [{
                x: this.stats.playlists[i].features[this.selectedFeature1],
                y: this.stats.playlists[i].features[this.selectedFeature2],
								r: Math.min(35, (this.stats.playlists[i].total / (this.totalTracks/150))),
              }],
            });
        }
      }
    },
    selectFeature1(f) {
      this.selectedFeature1 = f;
      this.createDataset();
    },
    selectFeature2(f) {
      this.selectedFeature2 = f;
      this.createDataset();
    },
  },
  created() {
    this.getRandomFeatures();
    this.createDataset();
  },
  watch: {
    'settings.includeFollowed': function() {
			if (this.hasLoaded) {
				this.createDataset();
			}
    },
    'settings.includePlaylists': function() {
			if (this.hasLoaded) {
				this.createDataset();
			}
		},
		hasLoaded: function() {
			if (this.hasLoaded) {
				this.createDataset();
			}
		}
  }
};
</script>

<style scoped>
	.compare-title {
		max-width: 100vw;
		text-align: left;
		margin-bottom: 0.5em;
	}
  .compare-1 {
    color: #FD797A;
    text-decoration: underline;
    cursor: pointer;
  }
  .compare-2 {
    color: #378FC8;
    text-decoration: underline;
    cursor: pointer;
  }
	.dropdown-menu {
		transform-origin: top;
		transition: all .1s ease-in-out;
	}
  .dropdown-content {
    padding: 0 !important;
  }
  .dropdown-item {
		text-align: left;
		margin-left: 0;
		padding: 0 !important;
  }
  .dropdown-item > .title {
    text-decoration: none;
		word-break: break-word;
  }
  .dropdown-item > .title:hover {
    opacity: 0.75 !important;
  }
  .chart {
    height: 90%;
	}
	@media only screen and (max-width:768px) {
		.compare-title {
			max-width: 78vw;
		}
	}
	.featureSlide-enter, .featureSlide-leave-to {
		opacity: 0;
		transform: translateY(-10px);
	}
</style>
