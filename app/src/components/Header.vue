<template>
	<nav class="navbar is-fixed-top" :class="{'is-primary': onMainPage}" role="navigation">
		<div class="navbar-brand">
			<a class="navbar-item navbar-logo" @click="navigateTo('/')">
				<img v-if="onMainPage" src="../assets/logo_white.svg"/>
				<img v-if="!onMainPage" src="../assets/logo.svg"/>
				<span v-if="windowWidth < 600" class="title logo-title beta" :class="{'logo-text-white':onMainPage}">β</span>
				<div v-if="windowWidth > 600" class="title logo-title" :class="{'logo-text-white': onMainPage}">Statify<span class="beta" :class="{'logo-text-white':onMainPage}">β</span></div>
			</a>
			<a class="navbar-item" @click="navigateTo('/faq')">FAQ</a>
			<div class="navbar-end end">
				<div class="navbar-item donate-button"> 
					<div class="field is-grouped"> 
						<p class="control"> 
							<a 
								@click="donate"
								class="button is-outlined is-primary" 
								:class="{'is-inverted': onMainPage}" 
							> 
								Donate 
								<font-awesome-icon class="donate-icon" :icon="['fab','paypal']" /> 
							</a> 
						</p> 
					</div> 
				</div> 
				<div v-if="$store.state.initialLoadDone && $route.path=='/'" ref="settingsButton" class="navbar-item has-dropdown" :class="{'is-active':showSettings}" @click="showSettings=!showSettings">
					<div class="navbar-link is-arrowless">
						<font-awesome-icon icon="sliders-h"></font-awesome-icon>
						<span class="arrow">
							<font-awesome-icon v-if="!showSettings" icon="angle-down"></font-awesome-icon>
							<font-awesome-icon v-if="showSettings" icon="angle-up"></font-awesome-icon>
						</span>
					</div>
					<div class="navbar-dropdown is-boxed is-right">
						<settings class="navbar-item"></settings>
				</div>
				</div>
			</div>
		</div>
	</div>
</nav>

</template>

<script>
import Settings from '@/components/Settings';
import { auth } from '../firebaseConfig';
export default {
	name: "Header",
	components: { Settings },
	computed: {
		onMainPage() {
			return this.$store.state.hasLoaded && this.$route.path == '/';
		}
	},
	data() {
		return {
			windowWidth: window.innerWidth,
			showSettings: false
		}
	},
	methods: {
		navigateTo(page) {
			if (page == '/' && auth.currentUser == null) {
				this.$router.push('/login');
			} else {
				// If already on page, scroll to top
				if (this.$route.path == page) {
					window.scrollTo({top:0,behavior:'smooth'});
				} else {
					this.$router.push(page);
				}
			}

		},
		donate() {
			this.$analytics.logEvent('clicked_donate');
			window.open('https://paypal.com/adrianhak','_blank');
		},
		logout() {
			this.$store.dispatch('logout');
			this.$router.go(); // Effectively refreshes page
		}
	},
	mounted() {
		this.$nextTick(() => {
			window.addEventListener("resize", () => {
				this.windowWidth = window.innerWidth;
			});
		});
	},
	created() {
		// Make settings  dropdown dissapear when clicking outside of dropdown 
    document.addEventListener('click', ((e) => { 
      let settings = this.$refs.settingsButton; 
      if (!settings.contains(e.target)) { 
        this.showSettings = false; 
      } 
    })); 

	}
}

</script>


<style lang="scss" scoped>
@import '../theme.sass';
.navbar {
	font-size: 1em;
	z-index: 99999 !important;
	box-shadow: 0 0 0.5em #aaa;
}
.navbar-brand {
	width: 100%;
}
.beta { 
	font-size: 14px; 
	letter-spacing: 0.1ch; 
	position: relative; 
	top: -8px;
	color: $primary;
	margin-left: 3px; 
}
.logo-title {
	margin-left:0.5vh;
}
.logo-text-white {
	color: white !important;
}
.navbar-item {
	opacity: 0.9;
}
.navbar-item:hover {
	opacity: 1;
}
.end {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
}
.end .navbar-item {
	opacity: 1 !important;
}
.donate-button:hover, .navbar-logo:hover {
	background-color: transparent !important;
}
.donate-icon { 
	margin-left:5px;
}
.arrow {
	margin-left: 0.35em;
}
</style>
