<template>
  <div id="home-content">
    <section class="hero">
      <div class="hero-body">
				<div class="home-brand">
          <img class="home-logo" src="../assets/logo.svg" />
          <h1 class="title home-title">Statify<span class="beta">β</span></h1>
				</div>
          <h2 class="subtitle">Your music taste in numbers</h2>
          <div class="launchpage-buttons">
            <a :href="loginURL" class="button is-dark start-btn is-rounded">
              <img class="spotify-logo" width="30px" src="../assets/spotify_icon_white.png" />Log in with Spotify
            </a>
          </div>
      </div>
    </section>
  </div>
</template>


<script>
export default {
	title: 'Statify',
  name: "Home",
  data() {
		return {
			loginURL: process.env.VUE_APP_LOGIN_URL,
		}
	},
	created() {
		this.$Progress.finish();
	}
};
</script>


<style lang="scss" scoped>
@import '../theme.sass';
#home-content {
  padding-top: 5vh;
  width: 100%;
  background-color: #fff;
}
.hero {
	margin: auto;
}
.hero-body {
  text-align: center;
  width: 100%;
  margin: auto;
  display: flex;
  flex-flow: column;
  justify-content: center;
}
.hero-body > h1 {
  margin-top: 0.5em;
  font-size: 3em;
}
.hero-body a {
  text-decoration: none;
  color: inherit;
  font-weight: bold;
}
.home-brand {
	display: flex;
	flex-flow: row;
	justify-content: center;
	align-items: center;
	margin: auto;
	margin-bottom: 1em;
}
.home-logo {
	width: 5.5em;
	margin-right: 0.25em;
}
.home-title {
	text-align: left;
	flex: 1;
	font-size: 5em;
}
.beta {
  color: $primary;
  font-size: 0.5em;
  position: relative;
  bottom: 1em;
  margin-left: 0.2em;
}
.launchpage-buttons {
  margin-top: -3em;
  display: flex;
  flex-flow: column;
}
.spotify-logo {
  margin: 10px;
	margin-left: 0;
}
.start-btn {
  z-index: 1;
  margin: 3.5em auto 1em auto;
  flex: 1;
  height: 3em;
  padding-right:25px;
	color: white !important;
}
@media only screen and (max-width: 768px) {
  #home-content {
    padding-top: 0;
  }
	.home-logo {
		width: 3.5em;
	}
	.home-title {
		font-size: 3.5em;
	}
}
</style>
