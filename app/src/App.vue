<template>
  <div id="app">
    <Header></Header>
		<keep-alive>
    	<router-view :key="$route.fullPath" class="wrapper"/>
		</keep-alive>
		<vue-progress-bar></vue-progress-bar>
    <Footer></Footer>
  </div>
</template>

<script>
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {auth} from './firebaseConfig';
export default {
  name: 'App',
  components: { Header, Footer },
	created() {
		this.$router.beforeEach((to, from, next) => {
			this.$Progress.start();
			next();
		});
		this.$router.afterEach((to, from) => {
			this.$Progress.finish();
		});
	}
};
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  html, body {
    height: 100%;
  }
  #app {
    display: flex;
    flex-direction: column;
    min-height: 100%;
		font-family: 'Inter', sans-serif;
  }
  .wrapper {
		height: 100%;
		flex: 1;
		display: flex;
		flex-flow: column;
    	width: 100%;
		background-color: #fafafa;
	}
  @media only screen and (max-width: 600px) {
    /* Provides cleaner UX by preventing text selection on scroll and app navigation */
    body {
      -webkit-user-select: none;
      -moz-user-select: -moz-none;
      -ms-user-select: none;
      user-select: none;
    }
    .wrapper {
        width: 100%;
    }
  }
</style>
