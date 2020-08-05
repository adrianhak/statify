<template>
	<div class="rating-stat-container">
		<!-- Special transition for happiness (or any stat using an icon) -->
		<transition v-if="getIcon" name="toggle" mode="out-in">
			<font-awesome-icon key="globe" class="globe" v-if="showGlobal" icon="globe"></font-awesome-icon>
		<font-awesome-icon key="mood" v-if="getIcon && !showGlobal" :icon="['far',getIcon]" style="font-size:2.5em;margin-right:0.25em;"></font-awesome-icon>
		</transition>
		<transition v-else name="expand">
			<font-awesome-icon class="globe" v-if="showGlobal" icon="globe"></font-awesome-icon>
		</transition>
		<h1 class="rating has-text-black" :class="{'global': showGlobal}">
			<ICountUp

				:endVal="showGlobal ? (globalRating != null ? globalRating : 0) : rating"
				:options={useEasing:true}
			/>%
		</h1>
	</div>
</template>

<script>
import ICountUp from 'vue-countup-v2';

export default {
	props: {
		showGlobal: false,
		rating: null,
		globalRating: null,
		getIcon: null
	},
	components: {
		ICountUp
	}
}
</script>

<style scoped lang="scss">
@import '../theme.sass';
.rating-stat-container {
	display: flex;
	flex-flow: row;
	align-items: center;
	justify-content: center;
}
.rating {
	font-size: 3em;
	font-weight: bold;
}
.global {
	color: $primary !important;
}
.globe {
	color: $primary;
	font-size: 2em;
	margin-right: 0.25em;
}


.toggle-enter-active, .toggle-leave-active, .expand-enter-active, .expand-leave-active {
	transition: all .25s;
}

.expand-enter, .expand-leave-to {
	width: 0;
}

.toggle-enter {
	opacity: 0;
	transform: translateY(20px);
}

.toggle-leave-to {
	opacity: 0;
	transform: translateY(-20px);
}

</style>
