# Statify

This is a web app powered by Vue and Firebase, showing you interesting stats and information about your 
Spotify playlists and listening habits. This is made possible thanks to Spotify's 
[Web API](https://developer.spotify.com/web-api).

The backend (`/functions`) consists of two cloud functions which together handles the OAuth 
authentication flow. The Vue frontend (`/app`) also connects to a Firestore database to 
update & retrieve 'global' averages for some statistics. 
