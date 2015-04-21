var isPushEnabled = false;

function sendSubscriptionToServer(_subscription) {
	console.log('TODO: Implement sendSubscriptionToServer()');
}

function unsubscribe() {}

function subscribe() {
	
	var pushButton = document.querySelector('.js-push-button');
	pushButton.disabled = true;

	navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
		serviceWorkerRegistration.pushManager.subscribe()
			.then(function(subscription) {
				isPushEnabled = true;
				pushButton.textContent = 'Disable Push Messages';
				pushButton.disabled = false;

				return sendSubscriptionToServer(subscription);
			})
			.catch(function(e) {
				if (Notification.permission === 'denied') {
					console.warn('Permission for Notifications was denied');
					pushButton.disabled = true;
				}else {
					console.error('Unable to subscribe to push.', e);
					pushButton.disabled = false;
					pushButton.textContent = 'Enable Push Messages';	
				}
			});
	});
}

function initialiseState() {

	if(!('showNotification' in ServiceWorkerRegistration.prototype)) { 
		console.log('Notifications aren\'t supported.');
		return;
	} 

	if (Notification.permission === 'denied') { 
		console.log('The user has blocked notifications.');
		return;
	}

	if (!('PushManager' in window)) {
		console.warn('Push messaging isn\'t supported.');
		return;
	}

	navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {

		console.log("swervice worker is ready.");

		serviceWorkerRegistration.pushManager.getSubscription()
			.then(function(subscription){

				var pushButton = document.querySelector('.js-push-button');
				pushButton.disabled = false;

				if(!subscription) { 
					return;
				}

				sendSubscriptionToServer(subscription);

				pushButton.textContent = 'Disable Push Messages';
				isPushEnabled = true;

			})
			.catch(function(err) {
				console.warn('Error during getSubscription()', err);
			});
	});
}

window.addEventListener('load', function() {
	var pushButton = document.querySelector('.js-push-button');

	pushButton.addEventListener('click', function(){
		if(isPushEnabled) {
			unsubscribe();
		} else {
			subscribe();
		}
	});

	if('serviceWorker' in navigator) {
		navigator.serviceWorker.register('./js/service-worker.js').then(initialiseState).catch(function(err){
		console.log('ServiceWorker registration failed: ', err);
	});
	}else {
		console.log('Service workers aren\'t supported in this browser.');
	}
});

