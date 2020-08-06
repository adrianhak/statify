<template>
	<div id="callback-container">
		<!-- Loading spinner -->
		<div class="spinner">
			<div class="rect1"></div>
			<div class="rect2"></div>
			<div class="rect3"></div>
			<div class="rect4"></div>
			<div class="rect5"></div>
		</div>
	</div>
</template>

<script>
import router from '../router';
import { auth } from '../firebaseConfig';
export default {
	created() {
		if (this.$route.query.code && localStorage.getItem('state') === this.$route.query.state) {
			this.$jsonp(process.env.VUE_APP_TOKEN_URL,{code:this.$route.query.code,state:this.$route.query.state})
				.then(async json => {
					this.$store.commit('SET_ACCESS_TOKEN',json.accessToken);
					this.$spotify.setAccessToken(this.$store.state.accessToken);
					await auth.signInWithCustomToken(json.token);
					this.$router.push('/');
				}).catch(err => {
					// User probably refreshed page and tried to use old invalid code, redirect to login page
					this.$router.push('/login');
				});
		} else {
			// Redirect if not accessed correctly
			this.$router.push('/login');
		}
	},
};
</script>
