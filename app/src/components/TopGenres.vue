<template>
	<div class="top-genres-container">
		<portal to="Top Genres">
			<h1 class="card-title">Top Genres</h1>
		</portal>
		<div v-if="!pl">
		<div v-if="!$root.mobile" class="genres-list">
			<transition name="globe-fade">
				<font-awesome-icon v-if="showGlobal" icon="globe" class="bg-globe" style="z-index:0"></font-awesome-icon>
			</transition>
		<transition-group name="genres-transition" tag="ol" class="top-3">
			<li class="genre-entry" :key="genre" 
					:class="{'is-first':index==0,'is-second':index==1,'is-third':index==2}"
					v-for="(genre,index) in currentList.slice(0,3)">
					<p class="genre-placement">{{ index+1 }}</p>
					<p class="genre-name">{{ genre }}</p>
				</li>
			</transition-group>
			<transition-group name="genres-transition" tag="ol" class="not-top-3">
			<li class="genre-entry" :key="genre"
				v-for="(genre,index) in currentList.slice(3,10)">
				<p class="genre-placement">{{ index+4 }}</p>
				<p class="genre-name">{{ genre }}</p>
			</li>
		</transition-group>
	</div>
	<div v-else>
		<carousel
			:perPage=1
			:speed=250
			:paginationEnabled=true
			:paginationPadding=5
		>
			<slide>
				<div class="top-3">
				<transition name="globe-fade">
					<font-awesome-icon v-if="showGlobal" icon="globe" class="bg-globe"></font-awesome-icon>
				</transition>
					<transition-group name="genres-transition" tag="div">
					<div class="genre-entry" :class="{'is-first':index==0,'is-second':index==1,'is-third':index==2}"
							v-for="(genre,index) in currentList.slice(0,3)" :key="genre">
						<p class="genre-placement">{{ index+1 }}</p>
						<p class="genre-name">{{ genre }}</p>
					</div>
				</transition-group>
				</div>
			</slide>
			<slide>
				<div class="not-top-3">
				<transition name="globe-fade">
					<font-awesome-icon v-if="showGlobal" icon="globe" class="bg-globe"></font-awesome-icon>
				</transition>
				<transition-group name="genres-transition" tag="div">
					<div class="genre-entry" :key="genre"
						v-for="(genre,index) in currentList.slice(3,10)">
						<p class="genre-placement">{{ index+4 }}</p>
						<p class="genre-name">{{ genre }}</p>
					</div>
				</transition-group>
				</div>
			</slide>
		</carousel>
	</div>
</div>
<!-- Playlist specific -->
<div v-else class="pl-genres-list top-3">
	<transition-group name="genres-transition" tag="div">
		<div class="genre-entry" :class="{'even':(index%2),'is-first':index==0,'is-second':index==1,'is-third':index==2}":key="genre"
			v-for="(genre,index) in currentList.slice(0,5)">
			<p class="genre-placement">{{ index + 1 }}</p>
			<p class="genre-name">{{ genre }}</p>
		</div>
	</transition-group>
</div>
</div>
</div>
</template>

<script>
import { mapState } from 'vuex';
import { Carousel, Slide} from 'vue-carousel';
import { updateGlobalGenres, getGlobalGenres } from '../firestoreQueries';

export default {
	data() {
		return {
			topGenres: [],
			globalGenres: [],
			currentList: [],
			genreDict: {},
		};
	},
	props: {
		pl: null,
		showGlobal: false
	},
	components: {
		Carousel,
		Slide
	},
	computed: mapState ({
		settings: 'settings',
		stats: 'stats',
		hasLoaded: 'hasLoaded'
	}),
	methods: {
		addToDict(genre) {
			if (genre in this.genreDict) {
				this.genreDict[genre] += 1;
			} else {
				this.genreDict[genre] = 1;
			}
		},
		replaceList() {
			if (this.showGlobal) {
				this.globalGenres.forEach((genre,i) => {
					this.currentList.splice(i, 1, genre);
				});
				this.currentList.splice(this.globalGenres.length);
			} else if (!this.showGlobal) {
				this.topGenres.forEach((genre, i) => {
					this.currentList.splice(i,1,genre.genre);
				});
				this.currentList.splice(this.topGenres.length);
			}
		},
		update() {
			this.topGenres = [];
			this.genreDict = {};
			if (!this.pl) { // Is true if called from general top genres chart
				let start = performance.now();
				if (this.settings.includeFollowed) {
					this.stats.followedPlaylists.forEach((playlist) => {
						playlist.genres.forEach((genre) => {
							this.addToDict(genre);
						});

					});
				}
				if (this.settings.includePlaylists) {
					this.stats.playlists.forEach((playlist) => {
						playlist.genres.forEach((genre) => {
							this.addToDict(genre);
						});

					});
				}
				if (this.settings.includeSaved) {
					this.stats.savedTracks.genres.forEach((genre) => {
						this.addToDict(genre);
					});
				}
				if (this.settings.includeRecentlyPlayed) {
					this.stats.recentlyPlayed.genres.forEach((genre) => {
						this.addToDict(genre);
					});
				}
				const genreList = [];
				Object.keys(this.genreDict).forEach((genre) => {
					genreList.push({genre: genre, val: this.genreDict[genre]});
				});
				genreList.sort((a, b) =>
					(b.val - a.val),
				);
				this.topGenres = genreList;
				this.replaceList();
			} else { // Playlist specific genres chart
					if (!this.pl.isPlaceholder) {
						this.pl.genres.forEach((genre) => {
							this.addToDict(genre);
						});
						const genreList = [];
						Object.keys(this.genreDict).forEach((genre) => {
							genreList.push({genre: genre, val: this.genreDict[genre]});
						});
						genreList.sort((a, b) =>
							(b.val - a.val),
						);
						this.topGenres = genreList.slice(0,5);
					} else {
						this.topGenres = [];
					}
					this.replaceList();
			}
		},
		async fetchGlobalGenres() {
			this.globalGenres = await getGlobalGenres();
			return;
		}
	},
	created() {
		this.update();
		if (!this.$store.state.isCached && !this.pl && this.$store.state.flaggedPlaylists.length == 0) {
			updateGlobalGenres((this.topGenres.slice(0,10)).map(a => a.genre));
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
		hasLoaded() {
			if (this.hasLoaded && !this.pl) {
				this.update();
			}
		},
		pl() {
			this.update();
		},
		showGlobal() {
			if (this.showGlobal && this.globalGenres.length == 0 && !this.pl) {
				this.fetchGlobalGenres().then(() => {
					this.replaceList(); 
				});
			} else {
				this.replaceList();
			}
		}
	},
};
</script>
<style scoped lang="scss">
@import '../theme.sass';
ol li {
	list-style-type: none;
}
.genres-list {
	display: flex;
	flex-direction: row;
	justify-content: center;
	position: relative;
}
.genre-entry {
	display: flex;
	flex-flow: row;
	align-items: center;
}
.genre-placement {
	margin-left: 5px;
	font-weight: bold;
	color: black !important;
	text-align: center;
	justify-self: center;
}
.genre-name {
	margin-left: 5px;
	flex: 1;
	text-align: left;
	justify-self: flex-start;
	word-break: break-word;
}
.is-first {
	color: $primary;
	font-size: 3em;
	text-align: center;
}
.is-second {
	font-size: 1.5em;
}
.is-third {
	font-size: 1.5em;
}

.top-3 {
	display: flex;
	flex: 1;
	flex-flow: column;
	font-weight: bold;
	align-items: stretch;
	position: relative;
}
.not-top-3 {
	margin-left: 5px;
	flex: 1;
	height: 100%;
	position: relative;
}
.not-top-3 .genre-entry .genre-placement {
	min-width: 1.2em; /* Center top list numbers for two digit numbers */
}

.bg-globe {
	position: absolute;
	top: 0;
	left: 0;
	margin: auto;
	width: 100%;
	height: 100%;
	z-index: -1;
	color: $primary;
	opacity: 0.25;
}

.even {
	background-color: #f2f2f2;
}

.genres-transition-enter-active, .genres-transition-leave-active {
	transition: all .5s;
}
.genres-transition-leave-active {
	position: absolute;
}

.genres-transition-enter, .genres-transition-leave-to {
	opacity: 0;
	transform: translateX(50px);
}

.genres-transition-move {
	transition: transform .5s;
}

.globe-fade-enter-active, .globe-fade-leave-active {
	transition: all 0.5s;
}

.globe-fade-enter, .globe-fade-leave-to {
	opacity: 0;
}

@media only screen and (max-width:768px) {
	.top-3 {
		align-self: flex-start;
		justify-content: flex-start;
	}
	/*  
	  Setting responsive font sizes for mobile (doesn't scale to desktop)
	*/
	.is-first {
		font-size: 16vw;
	}
	.is-second {
		font-size: 8vw;
	}
	.is-third {
		font-size: 8vw;
	}
}


/* Playlist specific */
.pl-genres-list .genre-entry {
	font-size: 1.25em;
}

.pl-genres-list .is-first {
	font-size: 1.75em;
}

@media only screen and (max-width: 768px) {
	.pl-genres-list {
		align-self: center;
		margin: auto;
	}
	.pl-genres-list .genre-entry {
		font-size: 8vw;
	}
	.pl-genres-list .is-first {
		font-size: 12vw;
	}
}
</style>
