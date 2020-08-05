<template>
	<div class="toplist-container">
		<portal :to="isTopArtists ? 'Top Artists' : 'Top Tracks'">
			<h1 class="card-title">{{ isTopArtists ? 'Top Artists' : 'Top Tracks' }}</h1>
		</portal>
		<div class="tabs is-fullwidth is-toggle is-small">
			<ul>
				<li v-for="(term, index) in terms" :key="index"
					:class="{'is-active':selectedTerm.label === term.label}">
					<a @click="selectTerm(term)"> {{ term.label }}</a>
				</li>
			</ul>
		</div>

		<carousel
			:ref=carouselRef
			:perPage=1
			:speed=250
			:minSwipeDistance=50
			:paginationEnabled=true
			:paginationPadding=5
		>
			<slide v-for="i in sliderPages" :key="i">
			<transition-group name="toplist">
				<div class="entry" :class="{'even':(index%2)}"
						v-for="(entry,index) in selectedTerm.data.slice((i-1)*10,(i-1)*10+10)" :key="entry.id"
				>
					<p class="placement">{{ (i-1)*10+index+1 }}</p>
					<a :href="entry.external_urls.spotify" class="entry-image"><img :src="isTopArtists ? entry.images[0].url : entry.album.images[0].url"/></a>
					<div class="entry-desc">
						<p><a :title="entry.name" :href="entry.external_urls.spotify">{{ entry.name }}</a></p>
						<p :title="isTopArtists ? '' : (entry.artists[0].name + ' - '+entry.album.name)" class="details">{{ isTopArtists ? '' : (entry.artists[0].name +' - '+entry.album.name) }}</p>
					</div>
					<div class="pop-container">
						<div v-for="n in (Math.floor((100-entry.popularity)/10))" class="pop-bar empty"></div>
						<div v-for="n in (Math.ceil(entry.popularity/10))" class="pop-bar filled"></div>
					</div>
				</div>
			</transition-group>
			</slide>
		</carousel>
	</div>


</template>

<script>
import { mapGetters } from 'vuex';
import { Carousel, Slide } from 'vue-carousel';
export default {
	props: {
		terms:null,
		isTopArtists: false
	},
  data() {
    return {
			selectedTerm: {label:'6 months',data:Array.from(this.terms['medium'].data)},
    };
  },
  components: {
    Carousel,
    Slide
  },
  computed: {
    sliderPages() { // Determine how many pages to show based on the length of the top lists
      if (this.selectedTerm.data.length%10 != 0) {
        return (this.selectedTerm.data.length - this.selectedTerm.data.length%10 + 10)/10;
      }
      return (this.selectedTerm.data.length - this.selectedTerm.data.length%10)/10;
		}
  },
  methods: {
    selectTerm(term) {
			term.data.forEach((entry,i) => {
				this.selectedTerm.data.splice(i,1,entry);
			});
			this.selectedTerm.data.splice(term.data.length);
			this.selectedTerm.label = term.label;
    }
  }
};
</script>
<style scoped>
.entry {
  display: flex;
  flex-flow: row;
  align-items: center;
  background-color: #FFF;
  color: #000;
	padding: 0.25em 0;
}
.entry a {
  text-decoration: none;
  color: inherit;
}
.placement {
  font-size: 1.5em;
  font-weight: bold;
  margin-right: 0.25em;
  min-width: 1.2em;
  text-align: center;
}
.entry-desc {
  display: flex;
  flex-flow: column;
}
.entry-desc > p, .details {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: flex-start;
}
.entry-desc > p {
  max-width: 9em;
}
.entry a:hover {
  opacity: 0.5;
}
.details {
  color: #1C2321;
	opacity: 0.75;
	font-size: 0.75em;
	max-width: 12em !important;
}
.entry-image {
	display: block;
	width: 100%;
	max-width: 2.5em;
	height: 2.5em;
	margin-right: 0.25em;
}
.pop-container {
	margin-left: auto;
	width: 75px;
	height: 20px;
	display: flex;
	flex-flow: row;
	justify-content: flex-end;
	align-items: center;
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
.tabs {
	margin-bottom: 5px;
}
.nav-buttons a {
  text-decoration: inherit;
  color: inherit;
  margin: 0 0.25em;
}
.nav-buttons a:active {
  color: gray;
}
.nav-buttons {
  font-size: 2em;
  text-align: right;
}
.even {
	background-color: #f2f2f2;
}

.toplist-enter-active, .toplist-leave-active {
  transition: all .5s;
}
.toplist-leave-active {
  position: absolute;
}

.toplist-enter, .toplist-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

.toplist-move {
  transition: transform .5s;
}


@media only screen and (max-width: 768px) {
	.entry-desc > p {
		max-width: 11em;
	}
}	
@media only screen and (min-width: 1600px) {
	.entry-desc > p {
		max-width: 18em;
	}
}
</style>
