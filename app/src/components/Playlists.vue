<template>
	<div class="playlists-container">
		<portal to="Playlist Quick Facts">
			<h1 class="card-title">Playlist Quick Facts<span v-if="!$root.mobile"> - 
					<span class="primary"> {{ selectedPL.name }}</span></span>
			</h1>
		</portal>
		<div ref="plDropdown" class="dropdown is-active">
			<div class="dropdown-trigger" @click="dropdownActive = !dropdownActive">
				<button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
					<div class="selectedPL">
					<img width="25em" style="margin-right:5px;" :src="selectedPL.image"/><p>{{ selectedPL.name }}</p>
				</div>
					<font-awesome-icon v-if="!dropdownActive" icon="angle-down" style="margin-left:3px;"></font-awesome-icon>
					<font-awesome-icon v-else icon="angle-up" style="margin-left:3px;"></font-awesome-icon>
				</button>
			</div>
			<transition name="slideDropdown">
			<div v-if="dropdownActive" class="dropdown-menu" id="dropdown-menu" role="menu">
				<div class="dropdown-content">
					<div v-if="includePlaylists">
					<div class="dropdown-item title">Created playlists</div>
					<div class="dropdown-item pl-list-item" :class="{'even':(i%2)}" @click="selectPL(pl)" v-for="(pl,i) in stats.playlists" :key="pl.id">
						<img class="pl-image" :src="pl.image">
						<p>{{ pl.name }}</p>
					</div>
				</div>
					<div v-if="includeFollowed"> 
					<div class="dropdown-divider"></div>
						<div class="dropdown-item title">Followed playlists</div>
						<div class="dropdown-item pl-list-item" :class="{'even':(i%2)}" @click="selectPL(pl)" v-for="(pl,i) in stats.followedPlaylists" :key="pl.id">
							<img class="pl-image" :src="pl.image" width="35em">
							<p>{{ pl.name }}</p>
						</div>
					</div>
				</div>
			</div>
		</transition>
		</div>
		<div v-if="flaggedPlaylists.includes(selectedPL)" id="pl-warning" class="notification is-warning is-light">
			<font-awesome-icon icon="exclamation-triangle"></font-awesome-icon>
			Playlist not properly processed 
		</div>
		<pl-quick-stats v-if="includePlaylists || includeFollowed" class="quickstats" :selectedPL="selectedPL"></pl-quick-stats>
		<div v-if="!$root.mobile" class="chart-titles">
			<p>Top Genres</p>
			<p>Features</p>
			<p>Release Dates</p>
		</div>
		<div v-if="!$root.mobile" class="pl-graphs">
			<top-genres class="pl-graph" :pl="selectedPL"></top-genres>
			<p-l-features class="pl-graph" :pl="selectedPL"></p-l-features>
			<track-release class="pl-graph" :pl="selectedPL"></track-release>
	</div>

	<!-- Mobile swiper for pl-graphs -->
	<div v-if="(includePlaylists || includeFollowed) && $root.mobile">
		<carousel
			:perPage=1
			:paginationEnabled=true
			:speed=250
			:minSwipeDistance=50
		>
			<slide>
				<p class="slide-graph-title">Features</p>
				<p-l-features class="pl-graph" :pl="selectedPL"></p-l-features>
			</slide>
			<slide>
				<p class="slide-graph-title">Top Genres</p>
				<top-genres class="pl-graph" :pl="selectedPL"></top-genres>
			</slide>
			<slide>
				<p class="slide-graph-title">Release Dates</p>
				<track-release class="pl-graph" :pl="selectedPL"></track-release>
			</slide>
		</carousel>
	</div>
	<p v-if="selectedPL.total > selectedPL.trackCap" style="font-size:0.7em;"><i>Note that only the last {{ selectedPL.trackCap }} tracks were analyzed</i></p>
</div>
</template>
<script>
import TopGenres from '@/components/TopGenres';
import PLFeatures from '@/components/PLFeatures';
import TrackRelease from '@/components/TrackRelease';
import PlQuickStats from '@/components/PlQuickStats';
import  { Carousel, Slide } from 'vue-carousel';
import { mapState } from 'vuex';
export default {
	data() {
		return {
			dropdownActive: false,
			selectedPL: {name:'',image:'', isPlaceholder: true},
			windowWidth: window.innerWidth,
		};
	},
	computed: mapState({
		stats:'stats',
		includeFollowed: state => state.settings.includeFollowed,
		includePlaylists: state => state.settings.includePlaylists,
		hasLoaded: 'hasLoaded',
		flaggedPlaylists: 'flaggedPlaylists'
	}),
	components: {
		TopGenres,
		PLFeatures,
		TrackRelease,
		PlQuickStats,
		Carousel,
		Slide
	},
	methods: {
		selectPL(pl) {
			this.selectedPL = pl;
		},
		update() {
			// User added a second pl source, only change on initial load and if playlists actually exist
			if (this.includePlaylists && this.includeFollowed) {
				if (this.selectedPL.isPlaceholder && this.stats.playlists.length != 0) { 
					this.selectPL(this.stats.playlists[0]);
				}
				return;	
			}
			// User removed followed playlists, make sure selectedPL is own playlist
			if (this.includePlaylists) {
				if ((this.selectedPL.isFollowed || this.selectedPL.isPlaceholder) && this.stats.playlists.length != 0) {
					this.selectPL(this.stats.playlists[0]); 
				}
			}
			// User removed own playlists, make sure selectedPL is followed
			else if (this.includeFollowed) {
				if ((!this.selectedPL.isFollowed || this.selectedPL.isPlaceholder) && this.stats.followedPlaylists.length != 0) {
					this.selectPL(this.stats.followedPlaylists[0]); 
				}
			}
			// User removed all pl sources, keep default value
			else {
				this.selectPL({name:'',image:'',isPlaceholder:true});
			}
		}
	},
	created() {
		this.update();
		// Make dropdown dissapear when clicking outside of dropdown
		document.addEventListener('click', ((e) => {
			if (this.$refs.plDropdown) {
				let dropdown = this.$refs.plDropdown;
				if (!dropdown.contains(e.target) || e.target.classList.contains('dropdown-item') || e.target.parentElement.classList.contains('dropdown-item')) {
					this.dropdownActive = false;
				}
			}
		}));

	},
	watch: {
		'includePlaylists': function() {
			if (this.hasLoaded) {
				this.update();
			}
		},
		'includeFollowed': function() {
			if (this.hasLoaded) {
				this.update();
			}
		},
		hasLoaded: function() {
			if (this.hasLoaded) {
				this.update();
			}
		}
	}
};
</script>

<style lang='scss' scoped>
@import '../theme.sass';
.playlists-container {
	text-align: left;
	overflow-x: hidden;
}
.dropdown {
	max-width:80%;
}
.dropdown-menu {
	max-height: 16em;
	width: 100%;
	transform-origin: top;
	transition: all .1s ease-in-out;
}
.dropdown-content {
	max-height: inherit;
	overflow-y: scroll;
}
.dropdown-item.title {
	margin: 0;
	padding: 0;
	
}
.selectedPL {
	display: flex;
	margin-left: 0.25em;
	flex-flow: row;
	justify-content: flex-start;
	width: 100%;
	
}
.selectedPL p {
	max-width: 24em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.pl-list-item {
	padding: 0.2em 0 !important;
	display: flex !important;
	flex-flow: row !important;
	cursor: pointer !important;
	align-items: center;
	height: 2.5em;
}
.pl-list-item:hover {
	opacity: 0.75 !important;
}
.pl-list-item > p {
	white-space: nowrap;
	flex: 1;
	overflow: hidden;
	align-self: center;
	text-overflow: ellipsis;
	margin-left: 0.5em;
	max-width: 80%;
}
.pl-image {
	width: 2.5em;
	height: 2.5em;
}
#pl-warning {
	margin-right: auto;
	margin-left: auto;
	margin-top: 0.5em;
}
.quickstats {
	margin-top: 1em;
}
.pl-graphs {
	display: flex;
	flex-flow: row;
	margin-top: 3.5vh;
	justify-content: space-between;
	align-items: center;
}

.pl-graph {
	width: 30% !important;
}

.slide-graph-title {
	text-align: center;
	font-weight: bold;
	font-size: 1.2em;
	margin-top: 0.75em;
}

.chart-titles {
	margin: auto;
	display: flex;
	justify-content: space-between;
	margin-top: 1em;
	margin-bottom: -1.5em;
	font-weight: bold;
	font-size: 1em;
	width: 85%;
}
.even {
	background-color: #f2f2f2 !important;
}

.primary {
	color: $primary;
}

@media only screen and (min-width: 1600px) {
	.pl-graph {
		width: 25% !important;
		max-width: 33%;
	}
}
@media only screen and (max-width: 768px) {
	.pl-graph {
		width: 90% !important;
		margin-top: 1em !important;
		margin: auto;
	}
	.dropdown {
		max-width: 100% !important;
	}
	.selectedPL p {
		max-width: 14em;
	}
}

.slideDropdown-enter, .slideDropdown-leave-to {
	opacity: 0;
	transform: translateY(-1em);
}
</style>

