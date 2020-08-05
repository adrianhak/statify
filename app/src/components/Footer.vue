<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="content has-text-centered">
        <p>
          Made by
          <a href="mailto:adrian@adrianh.net">Adrian Håkansson</a>
            | Powered by <a href="https://spotify.com">Spotify</a>
					</br>
					&copy; 2020
					|
					<a href="mailto:adrian@adrianh.net">Feedback</a>
					|
					<a @click="$router.push('/faq')">FAQ</a>
					|
					<a href="https://github.com/adrianhak/statify">GitHub</a>
					|
					<a href="https://paypal.me/adrianhak" target="_blank">Donate</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  font-size: 12px;
  z-index: 1;
	padding-top: 1em !important;
	padding-bottom: 2em !important;
  background-color: #fff;
}
.content {
  margin-bottom: -2vh;
}
.content > p {
}
.content > p > a {
  text-decoration: none;
  font-weight: bold;
  color: inherit;
}
	
.content > p > a:hover {
  opacity: 0.8;
}
</style>
