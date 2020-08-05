<template>
	<div id="main-container">
		<transition name="fade">
			<div class="modal-background" v-if="!hasLoaded"></div>
		</transition>
		<!-- Loading spinner -->
		<div v-if="!hasLoaded" class="spinner">
			<div class="rect1"></div>
			<div class="rect2"></div>
			<div class="rect3"></div>
			<div class="rect4"></div>
			<div class="rect5"></div>
		</div>
		<div class="section">
			<!-- Error notification -->
			<div v-if="flaggedPlaylists.length > 0 && !warningClosed" class="notification is-warning" 
				id="warning-notification">
				<button class="delete" @click="warningClosed = !warningClosed"></button>
				<font-awesome-icon icon="exclamation-triangle"></font-awesome-icon>
				<b> Oops..</b> </br>Something went wrong processing your tracks.
			Accuracy may or may not be severely impacted.
			<p style="font-size:0.75em;margin-top:0.5em"><i><b>Affected playlists:</b> {{ flaggedPlaylists.map(x => x.name).join(', ') }}</i></p>
		</div>
		<!-- Quick stats -->
		<transition name="slidein">
			<div v-if="initialLoadDone">
				<div class="columns"  v-if="!$root.mobile">
					<div class="column is-3">
						<card cardID="uniqueness">
							<template v-slot:default="props">
								<uniqueness :showGlobal="props.showGlobal"></uniqueness>
							</template>
						</card>
					</div>
					<div class="column is-3">
						<card cardID="happinessRating">
							<template v-slot:default="props">
								<happiness-rating :showGlobal="props.showGlobal"></happiness-rating>
							</template>
						</card>
					</div>
					<div class="column is-3">
						<card cardID="explicitTracks">
							<template v-slot:default="props">
								<explicity :showGlobal="props.showGlobal"></explicity>
							</template>
						</card>
					</div>
				</div>
				<!-- Mobile swipe carousel -->
				<carousel v-if="$root.mobile" class="quick-facts-swiper"
					:perPage=1
					:scrollPerPage=true 
					:paginationEnabled=false
					:spacePadding=22
					:speed=250
					:centerMode=true>
					<slide class="slide">
						<card cardID="uniqueness">
							<template v-slot:default="props">
								<uniqueness :showGlobal="props.showGlobal"></uniqueness>
							</template>
						</card>
					</slide>
					<slide class="slide">
						<card cardID="happinessRating">
							<template v-slot:default="props">
								<happiness-rating :showGlobal="props.showGlobal"></happiness-rating>
							</template>
						</card>
					</slide>
					<slide class="slide">
						<card cardID="explicitTracks">
							<template v-slot:default="props">
								<explicity :showGlobal="props.showGlobal"></explicity>
							</template>
						</card>
					</slide>
				</carousel>
			</div>
		</transition>
		<transition name="slidein-second">
			<div v-if="initialLoadDone" class="stats-container">

				<!-- Top Genres -->
				<div class="columns is-multiline">
					<!-- Top Genres -->
					<div class="column is-6">
						<div class="columns is-multiline">
							<div class="column is-12">
								<card cardID="topGenres">
									<template v-slot:default="props">
										<top-genres :showGlobal="props.showGlobal"></top-genres>
									</template>
								</card>
							</div>
							<div class="column is-12">
								<card cardID="yearOfRelease">
									<template v-slot:default="props">
										<track-release :showGlobal="props.showGlobal"></track-release>
								</template>
							</card>
						</div>
						<div class="column is-6">
							<portal to="toplistToggle">
								<div class="tabs track-artist-toggle is-toggle is-small">
									<ul>
										<li :class="{'is-active':showArtists}"><a @click="showArtists = true">Artists</a></li>
										<li :class="{'is-active':!showArtists}"><a @click="showArtists = false">Tracks</a></li>
									</ul>
								</div>
							</portal>
							<card v-show="showArtists" cardID="topArtists">
								<toplist isTopArtists=true v-if="showArtists" :terms="$store.getters.artistTerms"></toplist>
							</card>
							<card v-show="!showArtists" cardID="topTracks">
								<toplist v-if="!showArtists" :terms="$store.getters.trackTerms"></toplist>
							</card>
						</div>
						<!-- Unique playlists -->
						<div class="column is-6">
							<card cardID="playlistPopularity">
								<playlist-popularity></playlist-popularity>
							</card>
						</div>
					</div>
				</div>
				<div class="column is-6">
					<div class="columns is-multiline">
						<!-- Playlists -->
						<div class="column is-12">
							<card cardID="playlists">
								<playlists ></playlists>
							</card>
						</div>
						<div class="column is-12">
							<card cardID="comparePlaylists">
								<playlist-comparison></playlist-comparison>
							</card>
						</div>
						<!--
						<div class="column is-12">
							<card cardID="moodOverTime">
								<mood-over-time></mood-over-time>
							</card>
						</div>
						-->
					</div>
				</div>
			</div>

		</div>
	</transition>
</div>
	</div>
</template>

<script>
import Uniqueness from '@/components/Uniqueness';
import TopGenres from '@/components/TopGenres';
import PlaylistPopularity from '@/components/PlaylistPopularity';
import PlaylistComparison from '@/components/PlaylistComparison';
import TrackRelease from '@/components/TrackRelease';
import HappinessRating from '@/components/HappinessRating';
import Explicity from '@/components/Explicity';
//import MoodOverTime from '@/components/MoodOverTime';
import Playlists from '@/components/Playlists'
import Toplist from '@/components/Toplist';
import Card from '@/components/Card'
import { set, get, del } from 'idb-keyval';
import { mapState } from 'vuex';
import { Carousel, Slide } from 'vue-carousel';


export default {

	data() {
		return {
			warningClosed: false,
			showArtists: true,

		};
	},
	components: {
		Uniqueness,
		TopGenres,
		PlaylistPopularity,
		PlaylistComparison,
		TrackRelease,
		HappinessRating,
		Explicity,
		//MoodOverTime,
		Playlists,
		Card,
		Carousel,
		Toplist,
		Slide
	},
	computed: mapState({
		hasLoaded: 'hasLoaded',
		initialLoadDone: 'initialLoadDone',
		flaggedPlaylists: 'flaggedPlaylists',
		settings: 'settings',
		totalPLTracks: 'totalPLTracks',
		globalMax: 'globalMax',
		statsx: 'stats'
	}),
	methods: {
		calculateCaps(tracksLeft,playlistsToCap) {
			let avg = Math.round(tracksLeft / playlistsToCap.length);
			// Keeps it from trying to correct rounding errors indefinitely
			if (avg <= 0) { return; } 

			for (let i = playlistsToCap.length-1; i >= 0; i--) {
				let pl = playlistsToCap[i];
				if ((pl.total-pl.trackCap) <= avg) {
					// -trackCap since that has been removed previously
					tracksLeft -= (pl.total-pl.trackCap); 
					this.$store.commit('ADD_PL_CAP',{pl:pl,cap:pl.total});
					playlistsToCap.splice(i,1);
				} else {
					this.$store.commit('ADD_PL_CAP',{pl:pl,cap:avg});
					tracksLeft -= avg;
					if (tracksLeft <= 0) {
						playlistsToCap.splice(i,1);
					}
				}
			}
			if (playlistsToCap.length > 0) {
				// Run recursively until global track limit has been distributed to all playlists
				this.calculateCaps(tracksLeft,playlistsToCap);
			}
			return;
		},
		startFetching() {

			this.$store.dispatch('getPlaylists',{offset:0,data:[]}).then(async() => {
				// Wait for the total of saved tracks to be fetched
				await this.$store.dispatch('probeSavedTracks');

				// Create a shallow copy, every playlist object is still a 
				// reference to the original
				let playlistsToCap = Array.from(this.statsx.playlists
					.concat(this.statsx.followedPlaylists)
					.concat(this.statsx.savedTracks));
				this.calculateCaps(Math.min(this.totalPLTracks
					+(this.statsx.savedTracks.total ? this.statsx.savedTracks.total : 0),this.globalMax),playlistsToCap);

				// If less than 10% of playlists are own, fetch followed as well
				if (this.statsx.playlists.length / (this.statsx.playlists.length 
					+ this.statsx.followedPlaylists.length) < 0.1) {
					// These values will be overwritten by SET_INITIAL_SETTINGS 
					// but the important part is that includeFollowed is true
					this.$store.commit('TOGGLE_SETTING',['includeFollowed',
						'includePlaylists','includeSaved','includeRecentlyPlayed']);
				}

				this.statsx.playlists.forEach((playlist) => {
					this.$store.commit('INCREMENT_QUEUE',{amount:2});
					// Async call to get all playlist tracks 
					// (which in turn calls artist and feature endpoints)
					this.$store.dispatch('getPlaylistTracks',{pl: playlist, 
						offset: playlist.total <= playlist.trackCap ? 0 : playlist.total - playlist.trackCap});
				});
				// Fetch followed if less than 10% of all playlists are own 
				if (this.$store.state.settings.includeFollowed) {
					this.$store.commit('PROCESSED_FOLLOWED');
					this.statsx.followedPlaylists.forEach((playlist) => {
						this.$store.commit('INCREMENT_QUEUE',{amount:2});
						this.$store.dispatch('getPlaylistTracks',{pl: playlist, 
							offset: playlist.total <=	playlist.trackCap ? 0 : playlist.total - playlist.trackCap});
					});
				}
				// Get saved tracks 
				// (fetch after playlists to avoid queue being emptied early)
				if (this.$store.state.settings.includeSaved && this.$store.state.stats.savedTracks.total > 0) { 
					this.$store.dispatch('getSavedTracks',{
						offset:0,data:[]}); 
				} else {
					this.$store.commit('PROCESS_SAVED_SUCCESS');
				}
				if (this.$store.state.settings.includeRecentlyPlayed) {
					this.$store.dispatch('getRecentlyPlayedTracks'); 
				}

				// Will fail if all retries are used and response from API is still 429 (for playlists only) , just log out
				// to let the user try again
			}).catch(err => {
				console.error(err);
				this.$store.dispatch('logout').then(() => {
					this.$router.push('/login');
				});
			});

			// Do these in parallel with playlists since they do not depend on each other
			this.$store.dispatch('getToplists',{i: 0,type: 'topTracks'});
			this.$store.dispatch('getToplists',{i: 0,type: 'topArtists'});

		},
		cacheState(state,expiry) {
			const now = new Date();
			const payload = {
				state: state,
				expiry: (now.getTime() + (expiry*1000*60*60)) // expiry in hours
			}
			set('state',payload)
				.then(() => console.log('CACHED STATE'))
				.catch(err => console.log(err));
		},
		async retrieveCachedState() {
			return await get('state').then(async (val) => {
				if (val === undefined) {
					return {exists:false};
				}
				// If cache has expired, remove it
				if (Date.now() > val.expiry) {
					del('state');
					console.log("CACHED STATE HAS EXPIRED");
					return {expired: true, exists: true};
				}
				console.log("RETRIEVING CACHED STATE");
				const settings = await get('settings')
				return {state:val.state,settings:settings,exists:true};
			});
		}
	},
	created() {
		this.retrieveCachedState().then((cachedState) => {
			// Valid cached state was found, initialize it
			if (cachedState.exists && !cachedState.expired) {
				this.$store.commit('INITIALIZE_STATE',{data:cachedState});
				this.$spotify.setAccessToken(this.$store.state.accessToken);

				// No cached state found, first time login. Start fetching
			} else if (cachedState.exists === false){
				this.startFetching();
			}
			// Cached state has expired, log out
			else if (cachedState.expired) {
				this.$store.dispatch('logout').then(() => {
					this.$router.push('/login');
				});
			}
		});
	},
	watch: {
		hasLoaded() {
			if (this.hasLoaded) {
				this.$Progress.finish();
				// Cache state only if not already cached and if fetch was completed with no errors
				if (!this.$store.state.isCached && this.$store.state.flaggedPlaylists.length == 0) {
					this.cacheState(this.$store.state,1); // 1 hour
				}
			}
		}
	}
}



</script>
<style> 
#main-container {
	padding-top: 3em;
	flex: 1;
	padding-bottom: 5vh;
	overflow-x: hidden; /* Fixes bug with Bulma columns overflowing */
}
.modal-background {
	opacity: 0.75 !important;
	z-index: 999 !important;
	position: fixed !important;
	background-color: #fff !important;
}

#warning-notification {
	width: 95%;
	margin-left: auto;
	margin-right: auto;
	max-height: auto; 
}

.stats-container {
	margin-top: 2em;
}

/* Mobile */

.quick-facts-swiper {
	width: 100%;
	margin-bottom: 3em;
}
.quick-facts-swiper > .VueCarousel-wrapper {
	overflow: visible; /* Fixes issue with vue-carousel vertical overflow */
}

.slide {
	position: relative;
	top: 2px;
	margin-right:4px;
	height: 24vh;
}

@media only screen and (min-width: 768px) {
	.pl-comparison {
		height: 60vh;
	}
	.section {
		margin: auto 2em;
	}
} 
@media only screen and (max-width: 768px) {
	.section {
		padding: 0 !important;
		width: 100%;
		margin-top: 1em;
	}

	.stats-container {
		width: 95%;
		margin: auto;
	}
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
	transition: opacity 0.5s !important;
}
.fade-enter, .fade-leave-to {
	opacity: 0 !important;
}
.slidein-enter, .slidein-second-enter {
	transform: translateY(200px) !important;
	opacity: 0 !important;
}
.slidein-enter-active {
	transition: all .75s !important;
}
.slidein-second-enter-active {
	transition: all .90s !important;
}

/* Loading spinner */
.spinner {
	position: fixed;
	width: 50px;
	height: 50px;
	top: 45%;
	left: 0;
	right: 0;
	margin-left: auto;
	margin-right: auto;
	text-align: center;
	font-size: 10px;
	z-index: 9999;
}

.spinner > div {
	background-color: #BF61B0;
	height: 100%;
	width: 6px;
	margin: 0 1px;
	display: inline-block;

	-webkit-animation: sk-stretchdelay 1.2s infinite ease-in-out;
	animation: sk-stretchdelay 1.2s infinite ease-in-out;
}

.spinner .rect2 {
	-webkit-animation-delay: -1.1s;
	animation-delay: -1.1s;
}

.spinner .rect3 {
	-webkit-animation-delay: -1.0s;
	animation-delay: -1.0s;
}

.spinner .rect4 {
	-webkit-animation-delay: -0.9s;
	animation-delay: -0.9s;
}

.spinner .rect5 {
	-webkit-animation-delay: -0.8s;
	animation-delay: -0.8s;
}

@-webkit-keyframes sk-stretchdelay {
	0%, 40%, 100% { -webkit-transform: scaleY(0.4) }  
	20% { -webkit-transform: scaleY(1.0) }
}

@keyframes sk-stretchdelay {
	0%, 40%, 100% { 
		transform: scaleY(0.4);
		-webkit-transform: scaleY(0.4);
	}  20% { 
		transform: scaleY(1.0);
		-webkit-transform: scaleY(1.0);
	}
}

</style>
