import 'bulma/css/bulma.css';
import 'bulma-switch/dist/css/bulma-switch.min.css';
import './theme.sass';
import Vue from 'vue';
import Vuex from 'vuex';
import Spotify from 'spotify-web-api-js';
import App from './App';
import router from './router';
import store from './store';
import VTooltip from 'v-tooltip';
import VueProgressBar from 'vue-progressbar';
import VueJsonp from 'vue-jsonp';
import PortalVue from 'portal-vue';
import { auth, analytics } from './firebaseConfig';

// FontAwesome imports
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';
import {faGlobe, faSlidersH, faCaretUp,faCaretDown, faAngleUp, faAngleDown, faQuestion, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faSmile, faLaugh, faFrown, faMeh } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faPaypal, faGlobe, faSlidersH, faCaretUp, faCaretDown, faSmile, faLaugh, faFrown, faMeh,faAngleUp,faAngleDown, faQuestion, faExclamationTriangle);
Vue.component('font-awesome-icon',FontAwesomeIcon);

Vue.use(Vuex);
Vue.use(VTooltip);
Vue.use(VueJsonp,6000);
Vue.use(PortalVue);

const progressBarOptions = {
	color: '#BF61B0',
  failedColor: 'red',
  height: '2px',
	autoFinish: false
};
Vue.use(VueProgressBar,progressBarOptions);
Vue.prototype.$spotify = new Spotify();
Vue.prototype.$analytics = analytics;

// Avoid setting up event listeners in every component by using this (https://stackoverflow.com/questions/36170425/)
Vue.directive('click-outside', {
  bind: function (el, binding, vnode) {
    el.clickOutsideEvent = function (event) {
      // here I check that click was outside the el and his childrens
      if (!(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        vnode.context[binding.expression](event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unbind: function (el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
});

// Router guards
router.beforeEach((to, from, next) => {
	window.scrollTo(0,0);
	document.title = to.meta.title ? to.meta.title : 'Statify';
	if (to.path == '/') {
		// Redirect if not logged in
		if (!auth.currentUser) {
			next('/login');
		}
	}
	// Redirect if user is logged in and trying to access login page
	if (to.path == '/login' && auth.currentUser != null) {
		next('/');
	}
	next();
});

// Only create app when auth object is ready
let app;
auth.onAuthStateChanged(user => {
	if (!app) {
		app = new Vue({
  		el: '#app',
  		router,
  		store,
  		components: { App },
			data() {
				return {
					mobile: window.innerWidth <= 700
				}
			},
			created() {
				addEventListener('resize',() => {
					this.mobile = innerWidth <= 768;
				});
			},
		render: h => h(App)
		});
	}

});
