import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/analytics';
import 'firebase/firestore';
const firebaseConfig = {
	apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
	authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
	databaseURL: process.env.VUE_APP_FIREBASE_DB_URL,
	projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VUE_APP_FIREBASE_APP_ID,
	measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
};

firebase.initializeApp(firebaseConfig);

const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

// Use emulator if in development environment
if (process.env.NODE_ENV == 'development') {
	db.settings({
		host: '10.0.0.14:8081',
		ssl: false
	});
}

export {
	analytics,db,auth
};
