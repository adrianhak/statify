<template>
	<div id="faq-container">
		<div class="box">
			<div class="content">
				<div class="article">
					<p class="title">FAQ</h1>
					<p id="what-is-this" class="subtitle is-4 q">
						What is this?
					</p>
					<p class="a">
						Statify is a web app that presents you with
						various bits of information and statistics about your playlists and listening habits on Spotify. This is made possible thanks to Spotify's <a href="https://developer.spotify.com/documentation/web-api/">Web API</a>.
					</p>
					<p id="who-made-this" class="subtitle is-4 q">
					Who made this?
					</p>
					<p class="a">
						Adrian Håkansson did, as a hobby project. 
						If you have any question, suggestion, issue or 
						feedback you can get in touch with me by 
						<a href="mailto:contact@adrianh.net">email</a>.
					</p>
					<p id="global-stats" class="subtitle is-4 q">
						What does the 
						<font-awesome-icon icon="globe"></font-awesome-icon> mean?
					</p>
					<p class="a">
						For some statistics you can click on the <font-awesome-icon icon="globe"></font-awesome-icon> button to see the average value(s) calculated from every Statify user's data. It is <i>not</i> representative of all Spotify users.   
					</p>
					<p id="access" class="subtitle is-4 q">
						What exactly will Statify have access to?
					</p>
					<p class="a">

						Statify uses Spotify's official Web API which means Statify will never have full or direct access to your account. Here is a list of everything Statify will be able to see and process through the API:
						<ul>
							<li>Access your username & display name</li>
							<li>Access your saved tracks</li>
							<li>Access your playlists (both followed and your 
								own)
							</li>
							<li>Access your top artists & tracks</li>
							<li>Access your recently played tracks</li>
						</ul>
						Statify is not able to create, modify or delete anything 
						and will NOT have access to your email address, password
						nor any payment information.
				</p>
				<p id="privacy" class="subtitle is-4 q">
					How will you use my data?	
				</p>
				<p class="a">
					Some properties of your data is stored permanently in order to provide average values for some 
					statistics. It consists of your username, a list of your top
					10 genres, the release dates of the tracks in your playlists
					and your current 'scores' in explicity, happiness & uniqueness.
					Everything else will only be stored locally in your browser to 
					serve as a local cache.
					Since Statify is open source you can verify this yourself by visiting
					the <a href="https://github.com/adrianhak/statify">GitHub repository</a>.
					</br>If you wish to have your data removed,
					just send me an <a href="mailto:adrian@adrianh.net">email</a> stating your Spotify username. (Note that
					your username is usually not the same as your display name. Check out
					<a href="https://www.spotify.com/account/overview/">this page</a> if 
					you're not sure.)</p>
			</div>
		</div>
	</div>
</div>
</div>
</template>
<script>
	export default {
		title: 'FAQ - Statify'
	}
</script>


<style lang="scss" scoped>
$box-radius: 0;
@import '../theme.sass';
#faq-container {
	padding-top: 12vh;
	text-align: center;
}
#faq-container .title {
	font-size: 3em;
}
.content {
	padding: 0 30%;
}
.article {
	margin: auto;
	margin-top: 2em;
	text-align: left;
}
.q {
	color: $primary !important;
}
ul {
	list-style:disc;
}
@media only screen and (max-width:768px) {
	.content {
		padding: 0 !important;
		padding-left: 0.5em !important;
		padding-right: 0.5em !important;
	}
}
</style>
