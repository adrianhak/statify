import { db, auth } from './firebaseConfig';
import store from './store';

const sortReleaseDates = (globalReleaseDates => {
	let list = [];
	const total = Object.values(globalReleaseDates).reduce((sum,val) => sum + val);
	Object.keys(globalReleaseDates).forEach(releaseDate => {
		const percent = (globalReleaseDates[releaseDate] / total) * 100;
			list.push({x: releaseDate.toString(), y: percent});
	});
	list.sort((a,b) => {
		return a.x - b.x;
	});
	return list;
});

// Fetches global averages for a specific stat. 
const getGlobalRating = (async (stat) => {
		console.log("READING DB");
		return await db.collection('stats').doc(stat).get().then(doc => {
			if (doc.exists) {
				return doc.data().value;
			}
		});
});

const getGlobalGenres = (async () => {
	console.log("READING DB")
	return await db.collection('stats').doc('genres').collection('topGenres')
			.orderBy('value','desc').limit(10).get().then(querySnapshot => {
												
				let topList = [];
				querySnapshot.forEach(doc => {
					topList.push(doc.data().name);
				});
		return topList;
	});
});

const getGlobalReleaseDates = (async () => {
	console.log("READING DB");
	const globalReleaseDatesDoc = await db.collection('stats').doc('releaseDates').get();
	const globalReleaseDates = globalReleaseDatesDoc.data().global;
	return sortReleaseDates(globalReleaseDates);
});

// Update genres
const updateGlobalGenres = (async (newUserTopGenres) => {
	const uid = auth.currentUser.uid;
	const topGenresRef = db.collection('stats').doc('genres').collection('topGenres');
	const userGenresRef = db.collection('stats').doc('genres').collection('userStats').doc(uid);
	
	return db.runTransaction(transaction => {
		return transaction.get(userGenresRef).then(async res => {
			// Empty if user is new
			const oldUserTopGenres = res.exists ? res.data().topGenres : [];
			let oldGenres = {};
			if (oldUserTopGenres.length != 0) {
				const oldGenresQuerySnapshot = await topGenresRef.where('name', 'in', oldUserTopGenres).get();
				oldGenresQuerySnapshot.forEach(doc => {
					oldGenres[doc.data().name] = doc.data().value;	
				});
			}
			let newTopGenres = {};
			for (const [i,genre] of oldUserTopGenres.entries()) {
				const oldGenre = oldGenres[genre]// TODO: Fetch all these in a single query
				const newIndex = newUserTopGenres.indexOf(genre);
				// If genre is still on top list, calculate the difference in ranking
				if (newIndex != -1) {
					if ((i - newIndex) != 0) { // Only overwrite if rank actually changed
						newTopGenres[genre] = oldGenre + (i - newIndex);
					}
				} else {
				// Genre is no longer on top list, its difference is the negative of its previous rank
					newTopGenres[genre] = oldGenre - (oldUserTopGenres.length - i);
				}
			}
			// Include the new genres not previously on list
			for (const [i,genre] of newUserTopGenres.entries()) {
					if (oldUserTopGenres.indexOf(genre) == -1) {
						const oldGenreDoc = await topGenresRef.doc(genre).get();
						if (oldGenreDoc.exists) {
							// Genre is already in db, add to old value
							newTopGenres[genre] = oldGenreDoc.data().value + (newUserTopGenres.length - i);
						} else {
							// Genre doesn't exist in db, user value is new value
							newTopGenres[genre] = (newUserTopGenres.length - i);
						}
					}
			}
			transaction.set(userGenresRef,{topGenres: newUserTopGenres});
			Object.keys(newTopGenres).forEach(genre => {
				const genreRef = topGenresRef.doc(genre);
				transaction.set(genreRef, {value:newTopGenres[genre], name: genre});
			});
		});
	});
});

// Update track release dates
const updateReleaseDates = (async (values) => {
	console.log("UPDATING GLOBAL RELEASE DATES");
	const uid = auth.currentUser.uid;
	const statRef = db.collection('stats').doc('releaseDates');
	const userStatRef = statRef.collection('userStats').doc(uid);
	return db.runTransaction(transaction => {
		return transaction.get(statRef).then(async res => {
			const globalReleaseMap = res.data().global;
			const releaseDiff = await userStatRef.get().then(userStat => {
				let releaseDiff = {};
				// If user already has data
				if (userStat.exists) {
					const oldUserReleaseDates = userStat.data().releaseDates;
					Object.keys(oldUserReleaseDates).forEach(releaseDate => {
						// If date is still present, calculate the difference
						if (values[releaseDate]) {
							releaseDiff[releaseDate] = values[releaseDate] - oldUserReleaseDates[releaseDate];
						} else {
						// Date is no longer present, difference is negative of its value
							releaseDiff[releaseDate] = -oldUserReleaseDates[releaseDate];
						}
					});
					// Include new dates not previously present
					Object.keys(values).forEach(releaseDate => {
						if (!oldUserReleaseDates[releaseDate]) {
							releaseDiff[releaseDate] = values[releaseDate];
						}
					});
				} else {
				// User is new
					Object.keys(values).forEach(releaseDate => {
						releaseDiff[releaseDate] = values[releaseDate];
					});
				}
				return releaseDiff;
			});
			transaction.set(userStatRef,{releaseDates: values});
			Object.keys(releaseDiff).forEach(releaseDate => {
				const oldVal = globalReleaseMap[releaseDate] ? globalReleaseMap[releaseDate] : 0;
				globalReleaseMap[releaseDate] = oldVal + releaseDiff[releaseDate];
			});
			store.commit('SET_GLOBAL_STAT',{stat:'releaseDates',value:sortReleaseDates(globalReleaseMap)});
			transaction.update(statRef,{global: globalReleaseMap});
		});
	});
});

// A transaction for updating user stats and settting new average value
const updateGlobalStat = (async (stat, value) => {
	const uid = auth.currentUser.uid;
	const statRef = db.collection('stats').doc(stat);
	const valRef = statRef.collection('userStats').doc(uid);
	
	return db.runTransaction(transaction => {
		return transaction.get(statRef).then(async res => {
			if (!res.exists) {
				console.log("Could not find stat document");
				return;
			}
			const oldValueTotal = res.data().value * res.data().numValues;
			const newData = await valRef.get().then(oldValue => {
				let newNumValues = res.data().numValues;
				let newAvgValue;
				// Update already existing user's stat
				if(oldValue.exists) {
					// Update the value total with new data
					const newValueTotal = (oldValueTotal - oldValue.data().value) + value;
					// Calculate new avg value, numValues stays the same since user isn't new
					newAvgValue = (newValueTotal / res.data().numValues);
				// Add new user's stat
				} else {
					newNumValues = res.data().numValues += 1;
					newAvgValue = (oldValueTotal + value) / newNumValues; 
				}
				return {newNumValues: newNumValues, newAvgValue: newAvgValue};
			});
			// Save new value in local state
			store.commit('SET_GLOBAL_STAT',{stat:stat,value:newData.newAvgValue});
			// Save new value in db
			transaction.update(statRef, {
				numValues: newData.newNumValues,
				value: newData.newAvgValue
			});
			transaction.set(valRef, {value: value});
		});
	});
});

export { getGlobalRating, 
				updateGlobalStat, 
				updateGlobalGenres, 
				getGlobalGenres, 
				updateReleaseDates,
				getGlobalReleaseDates };
