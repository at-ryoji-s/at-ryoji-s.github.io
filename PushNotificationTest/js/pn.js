var isPushEnabled = false;

// In sendSubscriptionToServer() you will need to consider how you handle failed network requests when updating the subscriptionId. 
// One solution is to track the state of the subscriptionId and endpoint in a cookie to determine whether your server needs the latest details or not.
// subscriptionIdが更新が失敗するときのことを考慮しておく必要がある。
// 解決方法としては、subscripctionIdの状態やendpointをトラックする。
// subscriptionIdやendpointはサーバが最新の詳細情報が必要かどうかを判断するためにクッキーに書いておく。
function sendSubscriptionToServer(_subscription) {
	// TODO: Send the subscription.subscriptionId and 
	// subscription.endpoint to your server and save 
	// it to send a push message at a later date
	console.log('TODO: Implement sendSubscriptionToServer()');
}

function showCurlCommand(subscription) {
  // The curl command to trigger a push message straight from GCM
  var subscriptionId = subscription.subscriptionId;
  var endpoint = subscription.endpoint;
  var curlCommand = 'curl --header "Authorization: key=' + API_KEY +
    '" --header Content-Type:"application/json" ' + endpoint + 
    ' -d "{\\"registration_ids\\":[\\"' + subscriptionId + '\\"]}"';

	console.log(curlCommand);
}


function unsubscribe() {

	// 処理中に連打されないように押せなくしておく
	var pushButton = document.querySelector('.js-push-button');
	pushButton.disabled = true;

	navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {

		// subscriptionオブジェクトを取得
		serviceWorkerRegistration.pushManager.getSubscription().then(function(pushSubscription) {

			// subscriptionオブジェクトがないなら、ボタンを見た目を変えて、処理を終了。 
			if(!pushSubscription) {
				isPushEnabled = false;
				pushButton.textContent = 'Eable Push Messages';
				pushButton.disabled = false;
				return;
			}

			var subscriptionId = pushSubscription.subscriptionId;
			console.log('TODO: Implement remobeSubscriptionFromServer()');

			// 認証解除
			pushSubscription.unsubscribe().then(function(successful) {
          pushButton.disabled = false;
          pushButton.textContent = 'Enable Push Messages';
          isPushEnabled = false;
			}).catch(function(e) {
					// 認証解除に失敗	
					console.log('Unsubscription error: ', e);
          pushButton.disabled = false;
          pushButton.textContent = 'Enable Push Messages';
			});
		}).catch(function(e) {
			console.error('Error thrown while unsubscribing from push messaging.', e);
		});
	});
}	

function subscribe() {
	
	// 処理中に連打されないように押せなくしておく
	var pushButton = document.querySelector('.js-push-button');
	pushButton.disabled = true;

	navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
		// 新しい署名を作る
		serviceWorkerRegistration.pushManager.subscribe()
			.then(function(subscription) {
				// 成功
				isPushEnabled = true;
				pushButton.textContent = 'Disable Push Messages';
				pushButton.disabled = false;

				showCurlCommand(subscription) 

				return sendSubscriptionToServer(subscription);
			})
			.catch(function(e) {
				if (Notification.permission === 'denied') {
					// 署名が失敗したのは通知が許可されなかったから
					console.warn('Permission for Notifications was denied');
					pushButton.disabled = true;
				}else {
					// 失敗。manifestがまちがっているかも。
					console.error('Unable to subscribe to push.', e);
					pushButton.disabled = false;
					pushButton.textContent = 'Enable Push Messages';	
				}
			});
	});
}

// service workerの初期化処理
function initialiseState() {

	// Notificationをサポートしているか確認
	// してないなら通知許可ボタンはdisabledのままに
	if(!('showNotification' in ServiceWorkerRegistration.prototype)) { 
		console.log('Notifications aren\'t supported.');
		return;
	} 

	// ユーザが通知を禁止にしているか確認
	// 禁止なら通知許可ボタンをdisabeledのままに
	if (Notification.permission === 'denied') { 
		console.log('The user has blocked notifications.');
		return;
	}

	// PushManagerをサポートしているか確認
	// してないなら通知許可ボタンはdisabledのままに
	// これはまだベータ版Chromeにしかない(2015/04/10)
	if (!('PushManager' in window)) {
		console.warn('Push messaging isn\'t supported.');
		return;
	}

	// 通知許可の署名を得るためにservice workerの登録を確認
	navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {

		console.log("swervice worker is ready.");

		// 通知許可の署名をすでに持っているかどうか確認
		serviceWorkerRegistration.pushManager.getSubscription()
			.then(function(subscription){

				// 通知 許可/非許可ボタンをenableに
				var pushButton = document.querySelector('.js-push-button');
				pushButton.disabled = false;

				if(!subscription) { // 署名されたときのIDとかはいっているオブジェクト(https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription)のよう。
					// よくわからない。
					// 「未許可だからUIを許可できるような見た目に変える処理をする。」だと思われる。
					return;
				}

				// 署名済みならcookieなどに保存しておくのがいいらしい
				sendSubscriptionToServer(subscription);

				// curlコマンドを表示
				showCurlCommand(subscription) 

				// 非許可にできるようにボタンの文言を変更
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

	// service workerのサポートを確認
	if('serviceWorker' in navigator) {
		navigator.serviceWorker.register('./service-worker.js').then(initialiseState).catch(function(err){
		console.log('ServiceWorker registration failed: ', err);
	});
	}else {
		console.log('Service workers aren\'t supported in this browser.');
	}
});




