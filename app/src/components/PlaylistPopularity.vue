<template>
	<div class="PlaylistPopularity-container">
		<portal to="Most Unique Playlists">
			<h1 class="card-title">Most Unique Playlists</h1>
		</portal>
		<ol class="pl-list">
			<li class="pl-entry" :class="{'even':(index%2)}"
				v-for="(pl, index) in sortedTotal.slice(0,10)" :key="index">
				<p class="pl-placement">{{ index+1 }}</p>
				<a :href="pl.url" class="pl-image"><img :src="pl.image"/></a>
				<div class="pl-desc">
					<p> <a :href="pl.url">{{ pl.name }}</a></p>
						<p class="pl-total" style="opacity:0.75;font-size:0.75em;">Tracks: {{ pl.total }}</p>
					</div>
					<div class="pop-container">
						<div v-for="n in (Math.floor((100-pl.score)/20))" class="pop-bar empty"></div>
						<div v-for="n in (Math.ceil(pl.score/20))" class="pop-bar filled"></div>
					</div>
			</li>
		</ol>
	</div>
</template>

<script>
import { mapState } from 'vuex';
export default {
	data() {
		return {
			sortedPlaylists: [],
			sortedFollowed: [],
			sortedTotal: [],
		};
	},
	computed: {
		...mapState({
			settings: 'settings',
			stats: 'stats',
			hasLoaded: 'hasLoaded'
		})
	},
	methods: {
		updateFollowed() {
			this.sortedFollowed = [];
			if (this.settings.includeFollowed) {
				this.stats.followedPlaylists.forEach((pl) => {
					this.sortedFollowed.push({name:pl.name,image:pl.image,url:pl.url,total:pl.total,score:(pl.popularity/pl.tracksAnalyzed)});
				});
			}
		},
		updatePlaylists() {
			this.sortedPlaylists = [];
			if (this.settings.includePlaylists) {
				this.stats.playlists.forEach((pl) => {
					this.sortedPlaylists.push({name:pl.name,image:pl.image,url:pl.url,total:pl.total,score:(pl.popularity/pl.tracksAnalyzed)});
				});
			}
		},
		update() {
			this.sortedTotal = [];
			if (this.settings.includePlaylists) {
				if (this.sortedPlaylists.length == 0) {
					this.updatePlaylists();
				}
				this.sortedTotal = this.sortedPlaylists;
			}
			if (this.settings.includeFollowed) {
				if (this.sortedFollowed.length == 0) {
					this.updateFollowed();
				}
				this.sortedTotal = this.sortedTotal.concat(this.sortedFollowed);
			}
			this.sortedTotal.sort((a,b) => {
				return a.score - b.score;
			});
		},

	},
	created() {
		if (this.settings.includeFollowed) { this.updateFollowed(); }
		if (this.settings.includePlaylists) { this.updatePlaylists(); }
		this.update();
	},
	watch: {
		'settings.includeFollowed': function() {
			if (this.hasLoaded) {
				this.update();
			}
		},
		'settings.includePlaylists': function() {
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

<style scoped>

.pl-entry {
	display: flex;
	flex-flow: row;
	align-items: center;
	background-color: #FFF;
	color: #000;
	padding: 0.25em 0;

}
.pl-entry a {
	text-decoration: none;
	color: inherit;
}
.pl-placement {
	font-size: 1.5em;
	font-weight: bold;
	margin-right: 0.25em;
	min-width: 1.2em;
	text-align: center;
}
.pl-desc {
	display: flex;
	flex-flow: column;
}
.pl-desc > p {
	white-space: nowrap;
	overflow: hidden;
	max-width: 12em;
	text-overflow: ellipsis;
	align-self: flex-start;
	font-size: 0.9em;
}
pl-entry a:hover {
	opacity: 0.5;
}
.pop-container {
  margin-left: auto;
  width: 75px;
  height: 20px;
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  align-self: center;
  border-radius: 2px;
  border-color: gray;
}
.pop-bar {
  width: 3px;
  height: 15px;
  margin: 0 1px;
}
.filled {
  background-color: gray;
}
.empty {
  background-color: lightgrey;
}

.pl-entry a:hover {
	opacity: 0.5;
}
.pl-total {
	color: #1C2321;
}
.pl-image {
	display: block;
	width: 100%;
	max-width: 2.5em;
	height: 2.5em;
	margin-right: 0.25em;
}
.even {
	background-color: #f2f2f2;
}

@media only screen and (max-width: 768px) {
	.pl-desc > p {
		max-width: 13em;
	}
}
@media only screen and (min-width: 1600px) {
	.pl-desc > p {
		max-width: 20em;
	}
}
</style>
