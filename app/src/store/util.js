function rejectDelay(delay) {
	return new Promise((resolve, reject) => {
		setTimeout(reject,delay*1000);
	});
}


async function retryOnErr(retries,f) {
	let p = Promise.reject();
	for (let i = 0; i < retries; i++) {
		p = p.catch(f.bind(null,i)).catch(rejectDelay);
	}
	return p;
}

export { retryOnErr };
