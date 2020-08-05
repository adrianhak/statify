<template>
		<div  id="settings-extended">
				<div class="navbar-item-item">
					<div class="settings-title">Sources</div>
					<div class="field">
						<input v-model="activeSettings" id="includePlaylists" type="checkbox" value="includePlaylists" class="switch" :disabled="isDisabled('playlists')">
						<label for="includePlaylists">Created playlists</label>
					</div>
					<div class="field">
						<input v-model="activeSettings" id="includeFollowed" type="checkbox" value="includeFollowed" class="switch" :disabled="isDisabled('followedPlaylists')">
						<label for="includeFollowed">Followed playlists</label>
					</div>
					<div class="field">
						<input v-model="activeSettings" id="includeRecentlyPlayed" type="checkbox" value="includeRecentlyPlayed" class="switch" :disabled="isDisabled('recentlyPlayed')">
						<label for="includeRecentlyPlayed">Recently played</label>
					</div>
					<div class="field">
						<input v-model="activeSettings" id="includeSaved" type="checkbox" value="includeSaved" class="switch" :disabled="isDisabled('savedTracks')">
						<label for="includeSaved">Saved tracks</label>
					</div>
					<div class="dropdown-divider"></div>
					<p style="margin-bottom:5px;">Logged in as <span style="font-weight:bold;">{{ displayName }}</span></p>
					<div class="field">
						              <div class="field is-grouped">
                  <p class="control">
                      <a @click="logout" class="button is-outlined is-primary">
                        Log out
                      </a>
                  </p>
              </div>

					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import { mapState } from 'vuex';
import { auth } from '../firebaseConfig';
export default {
	computed: {
		activeSettings: { 
			get() {
				let list = [];
				Object.keys(this.$store.state.settings).forEach((key) => {
					if (this.settings[key]) { list.push(key); }
				});
				return list;
			},
			set(val) {
				// Used for analytics
				let activatedSource = Object.keys(this.settings)
					.map(x => !this.settings[x] ? (val.includes(x) 
					? x : null) : null).filter(el => el != null)[0];
				if (activatedSource) {
					this.$analytics.logEvent('enabled_setting',{setting:activatedSource});
				}
				if (activatedSource == 'includeFollowed') {
					this.$store.dispatch('fetchFollowed');
				}
				this.$store.commit('TOGGLE_SETTING',val);
			}
		},
		displayName() {
			return auth.currentUser.displayName.split(' ')[0];
		},
		...mapState ({
			settings: 'settings',
			hasLoaded: 'hasLoaded'
		})
	},

	methods: {
		logout() {
			this.$Progress.start();
			this.$store.dispatch('logout').then(() => {
				this.$router.push('/login'); // Effectively refreshes page
			});
		},
		isDisabled(setting) {
			if (setting == 'playlists' || setting == 'followedPlaylists') {
				return !(this.$store.state.stats[setting].length > 0);
			}
			return !(this.$store.state.stats[setting].total > 0);
		}

	}
}
</script>
<style scoped>
.settings-button {
	color: white;
	margin-right: 0.5em;
}
.settings-title {
	font-size: 1.2rem;
	margin-bottom: 0.25em;

}
#settings-extended {
	margin-right:1.5vh;
}
label {
	font-size: 0.9rem !important;
}
</style>

