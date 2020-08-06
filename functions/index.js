/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');

// Firebase Setup
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
});

// Spotify OAuth 2 setup
const SpotifyWebApi = require('spotify-web-api-node');
const Spotify = new SpotifyWebApi({
  clientId: functions.config().spotify.client_id,
  clientSecret: functions.config().spotify.client_secret,
  redirectUri: functions.config().spotify.redirect_uri
});


/**
 * Exchanges a given Spotify auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The Firebase custom auth token is sent back in a JSONP callback function with function name defined by the
 * 'callback' query parameter.
 */
exports.token = functions.region('europe-west1').https.onRequest((req, res) => {
  try {
      console.log('Received auth code:', req.query.code);
      Spotify.authorizationCodeGrant(req.query.code, (error, data) => {
        if (error) {
          throw error;
        }
        console.log('Received Access Token:', data.body['access_token']);
        Spotify.setAccessToken(data.body['access_token']);

        Spotify.getMe(async (error, userResults) => {
          if (error) {
            throw error;
          }
          console.log('Auth code exchange result received:', userResults);
          // We have a Spotify access token and the user identity now.
          const accessToken = data.body['access_token'];
          const spotifyUserID = userResults.body['id'];
	  	  const displayName = userResults.body['display_name'];

          // Create a Firebase account and get the Custom Auth Token.
          const firebaseToken = await createFirebaseAccount(spotifyUserID,displayName);
          // Serve an HTML page that signs the user in and updates the user profile.
          res.jsonp({token: firebaseToken, accessToken: accessToken});
        });
      });
  } catch (error) {
    return res.jsonp({error: error.toString});
  }
  return null;
});

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(spotifyID, displayName) {
  // The UID we'll assign to the user.
  const uid = `${spotifyID}`;

	console.log("READING DB");
  // Create a reference to user's document in firestore
	const userDataRef = admin.firestore().collection('users').doc(uid);
	let databaseTask = null;
  // If user already exists, just update the login count & timestamp
	if ((await userDataRef.get()).exists) {
		databaseTask = userDataRef.update({
      loginCount: admin.firestore.FieldValue.increment(1),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
		});
	} 
	// If user does not exist, create a new entry
	else {
		databaseTask = userDataRef.set({
			id:uid,
      firstLogin: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
			loginCount: 1
			});
	}
  // Create or update the user account.
  const userCreationTask = admin.auth().updateUser(uid, {
		displayName: displayName	
  }).catch((error) => {
    // If user does not exists we create it.
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: uid,
				displayName: displayName
      });
    }
    throw error;
  });

  // Wait for all async tasks to complete, then generate and return a custom auth token.
  await Promise.all([userCreationTask, databaseTask]);
  // Create a Firebase custom auth token.
  const token = await admin.auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return token;
}
