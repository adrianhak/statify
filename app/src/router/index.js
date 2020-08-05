import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/components/Home';
import FAQ from '@/components/FAQ';
import Callback from '@/components/Callback';
import Stats from '@/components/Stats';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/login',
      name: 'Home',
      component: Home,
			meta: {
				title: 'Login - Statify'
			}
    },
		{
			path: '/',
			name: 'Stats',
			component: Stats
		},
    {
      path: '/faq',
      name: 'FAQ',
      component: FAQ,
			meta: {
				title: 'FAQ - Statify',
			}
    },
    {
      path: '/callback',
      name: 'Callback',
      component: Callback,
    },
  ],
  mode: 'history',
});
