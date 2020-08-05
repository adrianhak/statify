import Vue from 'vue';
import Vuex from 'vuex';
import { retryOnErr } from './util';
import PromiseThrottle from 'promise-throttle';
import { del, set, get } from 'idb-keyval';
import { auth } from '../firebaseConfig';

Vue.use(Vuex);

// Throttle api requests to prevent rate-limiting
const promiseThrottle = new PromiseThrottle({
		requestsPerSecond: 50,
		promiseImplementation: Promise
});

const RETRY_LIMIT = 3; // The maximum number of times an api request should be made. (delay=retry-after field in response header)

export default new Vuex.Store({
		state: {
				hasLoaded: false,
				initialLoadDone: false,
				accessToken: null,
				hasProcessedFollowed: false,
				totalPLTracks: 0,
				plCap: 60,
				// globalMax is currently 100 for dev and 6000 in prod
				globalMax: process.env.VUE_APP_MAX_TRACKS,
				fetchedPlaylists: 0,
				playlistsQueue: 0,
				queueMax: 0,
				cursedPlaylists: [],
				flaggedPlaylists: [], // Non-critical errors, will trigger warning 
				terms: ['short_term', 'medium_term', 'long_term'],
				settings: {
						includePlaylists: true,
						includeSaved: true,
						includeRecentlyPlayed: true,
						includeFollowed: false,
				},

				stats: {
						features: ['danceability', 'energy', 'speechiness', 'acousticness', 'instrumentalness',
								'liveness', 'tempo', 'valence', 'explicity'],
						totalTracks: 0,
						topArtists: {
								short_term: [],
								medium_term: [],
								long_term: []
						},
						topTracks: {
								short_term: [],
								medium_term: [],
								long_term: []
						},
						playlists: [],
						followedPlaylists: [],
						savedTracks: {}, 
						recentlyPlayed: {},
						followedTracks: 0
				},
				globalStats: {
						// Omit genres since they are not fetched when updating
						uniqueness: null,
						happiness: null,
						explicity: null,
						releaseDates: []
				},
		},
		getters: {
				artistTerms: state => {
						return {
								'short': {
										label: '1 month',
										data: state.stats.topArtists.short_term
								},
								'medium': {
										label: '6 months',
										data: state.stats.topArtists.medium_term
								},
								'long': {
										label: 'Total',
										data: state.stats.topArtists.long_term
								}
						}
				},
				trackTerms: state => {
						return {
								'short': {
										label: '1 month',
										data: state.stats.topTracks.short_term
								},
								'medium': {
										label: '6 months',
										data: state.stats.topTracks.medium_term
								},
								'long': {
										label: 'Total',
										data: state.stats.topTracks.long_term
								}
						}
				},
				activeSources: state => {
						let list = [];
						Object.keys(state.settings).forEach((setting) => {
								if (state.settings[setting]) {
										switch (setting) {
												case 'includePlaylists':
														list.push('playlists');
														break;
												case 'includeFollowed':
														list.push('followed');
														break;
												case 'includeRecentlyPlayed':
														list.push('recently_played');
														break;
												case 'includeSaved':
														list.push('saved_tracks');
										}
								}
						});
						return list;
				}
		},
		mutations: {
				SET_LOADED_STATUS(state, value) {
						state.hasLoaded = value;
						// loading more content means any currently cached state is invalid
						if (!value) {
								state.isCached = false;
						} else {
								state.initialLoadDone = true; // Keep components rendered when loading second time 
						}
				},
				SET_ACCESS_TOKEN(state,token) {
						state.accessToken = token;
				},
				TOGGLE_SETTING(state, payload) {
						Object.keys(state.settings).forEach((setting) => {
								if (payload.includes(setting)) {
										Vue.set(state.settings, setting, true);
								} else {
										Vue.set(state.settings, setting, false);
								}
						});
						// If toggle doesn't require fetching more data, it can be saved directly without risking mismatch 
						if (state.hasLoaded && state.flaggedPlaylists.length == 0) {
								set('settings', state.settings);
						}
				},
				SET_TOP_LIST(state, payload) {
						Vue.set(state.stats[payload.type], state.terms[payload.term], payload.list);
				},
				INCREMENT_FETCHED(state, value) {
						state.fetchedPlaylists += value.length;
						value.forEach((pl) => {
								state.totalPLTracks += pl.tracks.total;
						});
				},
				SET_PLAYLISTS(state, payload) { // Also get followed on initial run
						payload.data.forEach((playlistsData) => {
								playlistsData = playlistsData.items;
								playlistsData.forEach((playlist) => {
									if (playlist.tracks.total > 0) {
										try {
											const plType = playlist.owner.id == auth.currentUser.uid ? 'playlists' : 'followedPlaylists';
											state.stats[plType].push({
												id: playlist.id,
												name: playlist.name,
												total: playlist.tracks.total, 
												featureData: [],
												fetched: 0,
												trackData: [],
												droppedTracks: 0,
												trackCap: 0,
												tracks: {},
												genres: [],
												tracksAnalyzed: 0,
												isFollowed: !(playlist.owner.id == auth.currentUser.uid),
												features: {},
												popularity: 0,
												explicitTracks: 0,
												releaseDates: [],
												artistIDs: [],
												trackIDs: [],
												image: playlist.images[0]?.url,
												url: playlist.external_urls.spotify,
											});
										} catch (err) { // If for example pl.images doesn't exist (local pl)
											console.error("ERROR IN PL " + playlist.name);
											console.error(err);
										}
									}
								});
						});
				},
				ADD_PL_CAP(state, payload) {
						if (payload.cap >= payload.pl.total) {
								payload.pl.trackCap = payload.pl.total;
						} else {
								payload.pl.trackCap += payload.cap;	
						}
				},
				PUSH_PLAYLIST_TRACKDATA(state, payload) {
						payload.pl.trackData = payload.data;
						payload.pl.fetched += payload.fetched;
						payload.pl.trackData.items.forEach((plTrack) => {
								// Skip adding track if it's completely cursed
								if (plTrack.track == null || plTrack.track.id == null || plTrack.is_local || plTrack.track.type != 'track') {
										payload.pl.droppedTracks++;
										return;
								}
								payload.pl.tracks[plTrack.track.id] = plTrack;
								payload.pl.tracks[plTrack.track.id]['features'] = {};
								payload.pl.popularity += plTrack.track.popularity;
								let tRelease = plTrack.track.album.release_date;
								try {
										payload.pl.releaseDates.push(tRelease.substring(0, 4));
								} catch(err) {
										console.error("Could not fetch album release date");
										this._vm.$analytics.logEvent('errorOccured',{errorType:'releaseDates',errMsg:err});
										if (!state.flaggedPlaylists.includes(payload.pl)) {
												state.flaggedPlaylists.push(payload.pl);
										}
								}
								if (plTrack.track.explicit) { payload.pl.explicitTracks++; }
								payload.pl.tracksAnalyzed++;
								payload.pl.artistIDs.push(plTrack.track.artists[0].id);
								payload.pl.trackIDs.push(plTrack.track.id);
								state.stats.totalTracks++;
								if (payload.pl.isFollowed) {
										state.stats.followedTracks++;
								}
						});
						// Vibe check the playlist
						if (payload.pl.trackIDs.length == 0) {
								console.log("REMOVING " + payload.pl.name);
								state.cursedPlaylists.push(payload.pl);
								state.playlistsQueue -= 2;
								state.totalTracks -= payload.pl.total;
						}
				},
				SET_SAVED_OR_RECENTLY_PLAYED(state, payload) {
						if (payload.total > 0) {
							state.stats[payload.type].tracks = {};
							state.stats[payload.type].name = payload.type == 'recentlyPlayed' ? 'Recently Played' : 'Saved Tracks';
							state.stats[payload.type].genres = [];
							state.stats[payload.type].total = payload.total;
							state.stats[payload.type].trackCap = 0;
							state.stats[payload.type].tracksAnalyzed = 0;
							state.stats[payload.type].artistData = [];
							state.stats[payload.type].featureData = [];
							state.stats[payload.type].droppedTracks = 0;
							state.stats[payload.type].trackData = [];
							state.stats[payload.type].releaseDates = [];
							state.stats[payload.type].artistIDs = [];
							state.stats[payload.type].fetched = 0;
							state.stats[payload.type].trackIDs = [];
							state.stats[payload.type].features = {};
							state.stats[payload.type].explicitTracks = 0;
						} else {
							state.stats[payload.type] = []; // This lets calculateCaps omit saved tracks
						}
				},
				PUSH_ARTIST_DATA(state, payload) {
						let artistData = payload.data.artists;
						// TODO: Find out why this doesn't work in some cases
						try {
								artistData.forEach((artist) => {
										artist.genres.forEach((genre) => {
												payload.pl.genres.push(genre);
										});
								});
						} catch(err) {
								console.error("Could not read artist genres"); 
								this._vm.$analytics.logEvent('errorOccured',{errorType:'artistData',errMsg:err});
								if (!state.flaggedPlaylists.includes(payload.pl)) {
										state.flaggedPlaylists.push(payload.pl);
								}
						}
				},
				PUSH_TRACK_FEATURES(state, payload) {
						payload.data.audio_features.forEach((tFeat) => {
								try {
										Object.keys(tFeat).forEach((fKey, i) => {
												payload.pl.tracks[tFeat.id]['features'][fKey] = tFeat[fKey];
												if (payload.pl['features'][fKey]) {
														payload.pl['features'][fKey] += tFeat[fKey] / payload.pl.tracksAnalyzed;
												} else {
														payload.pl['features'][fKey] = tFeat[fKey] / payload.pl.tracksAnalyzed;
												}
										});
								} catch (err) {
										this._vm.$analytics.logEvent('errorOccured',{errorType:'features',errMsg:err});
										console.error("ERROR IN: " + payload.pl.name);
										if (!state.flaggedPlaylists.includes(payload.pl)) {
												state.flaggedPlaylists.push(payload.pl);
										}
										console.log(err);
								}
						});
				},
				PROCESS_SAVED_SUCCESS(state) {
						state.hasProcessedSaved = true;
				},
				CLEAN_UP(state, payload) {
						if (state.stats.playlists.length != 0) {
								if (state.stats.playlists[0].artistIDs) {
										for (let i = state.stats.playlists.length - 1; i >= 0; i--) {
												delete state.stats.playlists[i].artistIDs;
												delete state.stats.playlists[i].trackIDs;
												delete state.stats.playlists[i].trackData;
												delete state.stats.playlists[i].featureData;
												if (state.cursedPlaylists.includes(state.stats.playlists[i])) {
														state.stats.playlists.splice(i, 1);
												}
										}
								}
						}
						if (state.hasProcessedFollowed) {
								for (let i = state.stats.followedPlaylists.length - 1; i >= 0; i--) {
										delete state.stats.followedPlaylists[i].artistIDs;
										delete state.stats.followedPlaylists[i].trackIDs;
										delete state.stats.followedPlaylists[i].trackData;
										delete state.stats.followedPlaylists[i].featureData;
										if (state.cursedPlaylists.includes(state.stats.followedPlaylists[i])) {
												state.stats.followedPlaylists.splice(i, 1);
										}
								}
								delete state.stats.savedTracks.artistIDs;
								delete state.stats.savedTracks.trackIDs;
								delete state.stats.savedTracks.trackData;
								delete state.stats.savedTracks.featureData;
								delete state.stats.recentlyPlayed.artistIDs;
								delete state.stats.recentlyPlayed.trackIDs;
								delete state.stats.recentlyPlayed.trackData;
								delete state.stats.recentlyPlayed.featureData;
						}
				},
				PROCESSED_FOLLOWED(state) {
						state.hasProcessedFollowed = true;
				},
				INCREMENT_QUEUE(state, payload) {
						state.playlistsQueue += payload.amount;
						if (state.playlistsQueue > state.queueMax) {
								state.queueMax = state.playlistsQueue;
						}
				},
				DECREMENT_QUEUE(state) {
						state.playlistsQueue--;
						let progress = 100 - (state.playlistsQueue / state.queueMax) * 100;
						this._vm.$Progress.set(100 - (state.playlistsQueue / state.queueMax) * 100);
				},
				// Makes sure only appropriate settings are active and available (always default to followed being false)
				SET_INITIAL_SETTINGS(state) {
						if (state.stats.playlists.length == 0) {
								state.settings.includePlaylists = false;
						} else { state.settings.includePlaylists = true; }

						if (state.stats.savedTracks.total > 0) {
								state.settings.includeSaved = true;
						} else { state.settings.includeSaved = false; }

						if (state.stats.recentlyPlayed.total > 0) {
								state.settings.includeRecentlyPlayed = true;
						} else { state.settings.includeRecentlyPlayed = false; }
				},
				// Set eventually saved settings
				SET_CACHED_SETTINGS(state, payload) {
						if (payload != null) {
								state.settings = payload;
						}
				},
				INITIALIZE_STATE(state, payload) {
						this.replaceState(Object.assign(state, payload.data.state));
						Object.assign(state.settings, payload.data.settings); // TODO: "Modularize" the rest of the state
						state.isCached = true;
				},
				SET_GLOBAL_STAT(state, payload) {
						Vue.set(state.globalStats,payload.stat,payload.value);
				}

		},
		actions: {
				async getToplists({ dispatch, commit, state }, payload) {
						retryOnErr(RETRY_LIMIT,async(nRetry) => {
								if (payload.type == "topTracks") {
										return this._vm.$spotify.getMyTopTracks({
												limit: 50,
												time_range: state.terms[payload.i]
										})
												.catch((err) => {
														console.error("FAILED FETCHING TOP TRACKS");
														throw err.getResponseHeader('retry-after');
												});
								} else if (payload.type == "topArtists") {
										return this._vm.$spotify.getMyTopArtists({
												limit: 50,
												time_range: state.terms[payload.i]
										})
												.catch((err) => {
														console.error("FAILED FETCHING TOP ARTISTS");
														throw err.getResponseHeader('retry-after');
												});
								}

						}).then(value => {
								let p = {
										type: payload.type,
										term: payload.i,
										list: value.items
								};
								commit('SET_TOP_LIST', p);
								if (payload.i < 2) {
										dispatch('getToplists', {
												i: payload.i + 1,
												type: payload.type
										});
								}

						});
				},
				async getPlaylists({ dispatch, commit, state }, payload) {
						return retryOnErr(RETRY_LIMIT,async(nRetry) => {
								return this._vm.$spotify.getUserPlaylists({
										limit: Math.min(50,(state.plCap-state.fetchedPlaylists)),
										offset: payload.offset
								})
										.catch((err) => {
												console.error("FAILED FETCHING PLAYLISTS");
												throw err.getResponseHeader('retry-after');
										});

						}).then(async(value) => {
								commit('INCREMENT_FETCHED', value.items);
								payload.data.push(value);
								// Fetch more playlists if fetched is less than hard cap OR if cap is exceeded and
								// total tracks are still less than track hard cap
								if ((state.fetchedPlaylists < value.total) && (state.fetchedPlaylists < state.plCap)) {
										await dispatch('getPlaylists', { offset: state.fetchedPlaylists, data: payload.data });
								} else {
										// Make sure playlists were fetched 
										// (handles the case when the user for some reason has literally 0 playlists)
										if (state.fetchedPlaylists == 0) {
												dispatch('checkIfDone');
												return;
										}
										// Process playlists
										commit('SET_PLAYLISTS', { data: Object.freeze(payload.data) });
								}
						});
				},
				// Since the API doesn't provide field selection for saved tracks, make a 'probe' with limit 1
				// in order to get the total amount of saved tracks. This will be used to calculate the trackCap
				async probeSavedTracks({ dispatch, commit, state }) {
						return retryOnErr(RETRY_LIMIT, async(nRetry) => {
								return this._vm.$spotify.getMySavedTracks({ limit: 1, offset: 0})
										.catch((err) => {
												console.error("FAILED PROBING SAVED TRACKS");
												throw err.getResponseHeader('retry-after');
										});
						}).then(value => {
								commit('SET_SAVED_OR_RECENTLY_PLAYED', { type:'savedTracks', total: value.total, });
						});
				},
				async getSavedTracks({ dispatch, commit, state }, payload) {
						retryOnErr(RETRY_LIMIT, async(nRetry) => {
								return this._vm.$spotify.getMySavedTracks({ 
										limit: Math.min(50, state.stats.savedTracks.trackCap - payload.offset), 
										offset: payload.offset })
										.catch(err => {
												console.error("FAILED FETCHING SAVED TRAKS");
												throw(err.getResponseHeader('retry-after'));
										});
						}).then(value => {
								payload.data.push(value);
								payload.offset += value.items.length;
								if (payload.offset < value.total && payload.offset < state.stats.savedTracks.trackCap) {
										dispatch('getSavedTracks', { offset: payload.offset, data: payload.data });
								} else {
										commit('INCREMENT_QUEUE', { amount: 2 });
										payload.data.forEach((savedData) => {
												commit('PUSH_PLAYLIST_TRACKDATA', { pl: state.stats.savedTracks, data: savedData });
										});
										if (!state.cursedPlaylists.includes(state.stats.savedTracks)) {
												dispatch('getArtists', { 
														pl: state.stats.savedTracks, 
														idList: state.stats.savedTracks.artistIDs, 
														tracksAnalyzed: state.stats.savedTracks.tracksAnalyzed 
												});
												dispatch('getTrackFeatures', { 
														pl: state.stats.savedTracks, 
														idList: state.stats.savedTracks.trackIDs 
												});
										}
										// If savedTracks is cursed, check if done
										else {
												dispatch('checkIfDone');
										}
								}
						}).catch((err) => {
								if (state.stats.savedTracks.fetched != 0 
										&& !state.flaggedPlaylists.includes(state.stats.savedTracks)) {
										state.flaggedPlaylists.push(state.stats.savedTracks);
								} else if (state.stats.savedTracks.fetched == 0) {
										state.cursedPlaylists.push(state.stats.savedTracks);
								}
								this._vm.$analytics.logEvent('failedFetch',{fetchType:'saved'});
								commit('DECREMENT_QUEUE');
								commit('DECREMENT_QUEUE');
								dispatch('checkIfDone');
						});
				},
				async getRecentlyPlayedTracks({ dispatch, commit, state }, payload) {
						retryOnErr(RETRY_LIMIT,async(nRetry) => {
								return this._vm.$spotify.getMyRecentlyPlayedTracks({ limit: 50 })
										.catch((err) => {
												console.error("FAILED FETCHING RECENTLY PLAYED");
												throw(err.getResponseHeader('retry-after'));
										});
						}).then(value => {
								commit('SET_SAVED_OR_RECENTLY_PLAYED', { type:'recentlyPlayed', total: value.items.length });
								commit('INCREMENT_QUEUE', { amount: 2 });
								commit('PUSH_PLAYLIST_TRACKDATA', { pl: state.stats.recentlyPlayed, data: value });
								if (!state.cursedPlaylists.includes(state.stats.recentlyPlayed)) {
										dispatch('getArtists', { pl: state.stats.recentlyPlayed, idList: state.stats.recentlyPlayed.artistIDs, tracksAnalyzed: state.stats.recentlyPlayed.tracksAnalyzed });
										dispatch('getTrackFeatures', { pl: state.stats.recentlyPlayed, idList: state.stats.recentlyPlayed.trackIDs });
										// If recentlyPlayed is cursed, check if done
								} else {
										dispatch('checkIfDone');
								}

						}).catch((err) => {
								// Since recentlyPlayed is only called once, a fail is always critical
								this._vm.$analytics.logEvent('failedFetch',{fetchType:'recently'});
								commit('DECREMENT_QUEUE');
								commit('DECREMENT_QUEUE');
								dispatch('checkIfDone');
						});
				},
				async getPlaylistTracks({ dispatch, commit, state }, payload) {
						console.log("FETCHING TRACKS");
						const playlist = payload.pl
						retryOnErr(RETRY_LIMIT, async(nRetry) => {
								return promiseThrottle.add(this._vm.$spotify.getPlaylistTracks.bind(this,playlist.id, {
										limit: Math.min(100, playlist.trackCap - playlist.fetched),
										fields: 'items(!added_by,available_markets),items(track(artists(id),album(release_date),duration_ms,explicit,id,name,popularity,href,type))',
										offset: payload.offset
								}))
										.catch(err => {
												console.error("FAILED FETCHING PLAYLIST TRACKS");
												throw(err.getResponseHeader('retry-after'));
										});

						}).then(value => {
								commit('PUSH_PLAYLIST_TRACKDATA', { pl: playlist, data: value, fetched: value.items.length });
								if (playlist.fetched < playlist.trackCap && playlist.fetched < playlist.total) {
										// Let the offset be pl total - (cap + fetched) to fetch the most recent tracks
										dispatch('getPlaylistTracks', { 
												pl: playlist, 
												offset: (playlist.total - (playlist.trackCap-playlist.fetched))
										});
								} else {
										// Only continue if playlist is OK
										if (!state.cursedPlaylists.includes(playlist)) {
												dispatch('getArtists', { 
														pl: playlist, 
														idList: playlist.artistIDs, 
														tracksAnalyzed: playlist.tracksAnalyzed 
												});
												dispatch('getTrackFeatures', { pl: playlist, idList: playlist.trackIDs });
										}
								}
								// If no response after all retries are used		
						}).catch((err) => {
								this._vm.$analytics.logEvent('failedFetch',{fetchType:'playlistTracks'});

								// If at least some tracks were fetched, flag the playlist which triggers alert to user
								if (!state.flaggedPlaylists.includes(playlist)) {
										state.flaggedPlaylists.push(playlist);
								}
								if (playlist.fetched > 0) {
										// Since getPlaylistTracks pushes track data in every iteration, analyze what we have
										dispatch('getArtists', { 
												pl: playlist, 
												idList: playlist.artistIDs, 
												tracksAnalyzed: playlist.tracksAnalyzed 
										});
										dispatch('getTrackFeatures', { pl: playlist, idList: playlist.trackIDs });

										// If no tracks were fetched, mark it as cursed and remove from queue
								} else if (playlist.fetched == 0) {
										state.cursedPlaylists.push(playlist);
										commit('DECREMENT_QUEUE');
										commit('DECREMENT_QUEUE');
										dispatch('checkIfDone');
								}
						});
				},
				async getArtists({ dispatch, commit, state }, payload) {
						let toFetch = payload.idList.splice(0, 50);
						retryOnErr(RETRY_LIMIT, async(nRetry) => {
								return promiseThrottle.add(this._vm.$spotify.getArtists.bind(this,toFetch))
										.catch(err => {
												console.error("FAILED FETCHING ARTISTS");
												throw(err.getResponseHeader('retry-after'));
										});
						}).then(value => {
								commit('PUSH_ARTIST_DATA', { pl: payload.pl, data: value });
								if (payload.idList.length > 0) {
										console.log("FETCHING MORE ARTISTS");
										// Recursive call for getting more (API limit is 50/request)
										dispatch('getArtists', { 
												pl: payload.pl, 
												idList: payload.idList, 
												tracksAnalyzed: payload.pl.tracksAnalyzed 
										});
								} else {
										console.log("DONE FETCHING ARTISTS FOR " + payload.pl.name);
										commit('DECREMENT_QUEUE');
										// Check if this was the last response
										dispatch('checkIfDone');
								}
						}).catch((err) => {
								this._vm.$analytics.logEvent('failedFetch',{fetchType:'artists'});
								if (state.flaggedPlaylists.includes(payload.pl)) {
										state.flaggedPlaylists.push(payload.pl);
								}
								if (payload.pl.genres.length == 0) {
										// Nothing was fetched, mark it as cursed
										state.cursedPlaylists.push(payload.pl);
								}
								commit('DECREMENT_QUEUE');
								dispatch('checkIfDone');
						});
				},
				async getTrackFeatures({ dispatch, commit, state }, payload) {
						let toFetch = payload.idList.splice(0, 100);
						retryOnErr(RETRY_LIMIT,async(nRetry) => {
								console.log("attempt number ",nRetry);
								return promiseThrottle.add(this._vm.$spotify.getAudioFeaturesForTracks.bind(this,toFetch))
										.catch((err) => {
												console.error('FAILED: ', payload.pl.name);
												throw err.getResponseHeader('retry-after'); // Seconds to wait until next retry
										});
						})
								.then((value) => {
										commit('PUSH_TRACK_FEATURES', { pl: payload.pl, tracksAnalyzed: payload.pl.tracksAnalyzed, data: value });
										if (payload.idList.length > 0) {
												dispatch('getTrackFeatures', { pl: payload.pl, idList: payload.idList });
										} else {
												console.log("DONE FETCHING FEATURES FOR " + payload.pl.name);
												commit('DECREMENT_QUEUE');
												// Hacky way of fixing issue where queue is emptied before saved tracks are added
												if (payload.pl.name == "Saved Tracks") { commit('PROCESS_SAVED_SUCCESS'); }
												dispatch('checkIfDone');
										}

								}).catch((err) => {
										this._vm.$analytics.logEvent('failedFetch',{fetchType:'features'});
										if (Object.keys(payload.pl.features).length != 0 && !state.flaggedPlaylists.includes(payload.pl)) {						state.flaggedPlaylists.push(payload.pl);
										} else if (Object.keys(payload.pl.features).length == 0) {
												state.flaggedPlaylists.push(payload.pl);
												state.cursedPlaylists.push(payload.pl);
										}
										commit('DECREMENT_QUEUE');
										dispatch('checkIfDone');
								});
				},
				fetchFollowed({ dispatch, commit, state }) {
						if (!state.hasProcessedFollowed) {
								commit('PROCESSED_FOLLOWED');
								commit('SET_LOADED_STATUS', false);
								state.stats.followedPlaylists.forEach((pl) => {
										commit('INCREMENT_QUEUE', { amount: 2 });
										dispatch('getPlaylistTracks', { pl: pl, offset: (pl.total <= pl.trackCap) ? 0 : (pl.total - pl.trackCap)});
								});
						}
				},
				async setCachedSettings({ dispatch, commit, state }) {
						if (state.flaggedPlaylists.length == 0 && !state.initialLoadDone) {
								commit('SET_CACHED_SETTINGS', await get('settings'));
						}
				},
				checkIfDone({ dispatch, commit, state }) {
						//commit('DECREMENT_QUEUE');
						// Since recently and saved is done in parallel with playlists, check them separately
						// They are done if they exist or if they are empty (= marked as cursed)
						let savedDone = state.hasProcessedSaved || state.cursedPlaylists.includes(state.stats.savedTracks);
						let recentlyDone = state.stats.recentlyPlayed.total >= 1 || state.cursedPlaylists.includes(state.stats.recentlyPlayed);
						if (state.playlistsQueue <= 0 && savedDone && recentlyDone) {
								commit('CLEAN_UP');
								// Initialize settings on first load only
								if (!state.initialLoadDone) {
										commit('SET_INITIAL_SETTINGS');
								} else if (state.flaggedPlaylists.length == 0) {
										// If fetch was lazy loaded, save any new setting (if fetch was complete)
										set('settings',state.settings);
								}
								console.log("Done Loading!");
								dispatch('setCachedSettings').then(() => {
										commit('SET_LOADED_STATUS', true);
										this._vm.$analytics.logEvent('load_success',{totalTracks:state.stats.totalTracks,followedTracks:state.stats.followedTracks});
								});
						}
				},
				async logout({ dispatch, commit, state }) {
						// Clear cached state from IndexedDB
						del('state');
						del('settings');
						await auth.signOut();
				}
		}
})
