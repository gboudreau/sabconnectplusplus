// List of sites that send the X-DNZB-Category HTTP header
var category_header_sites = ['nzbs.org', 'newzbin.com', 'newzxxx.com'];

var defaultSettings = {
	sabnzbd_url: 'http://localhost:8080/',
	provider_newzbin: true,
	provider_nzbmatrix: true,
	provider_nzbclub: true,
	provider_bintube: true,
	provider_nzbs: true,
	provider_binsearch: true,
	provider_nzbindex: true,
	provider_nzbsrus: true,
	provider_nzb: true,
	provider_fanzub: true,
	use_name_binsearch: true,
	use_name_nzbindex: true,
	config_refresh_rate: 15,
	config_enable_graph: true,
	config_enable_context_menu: true,
	config_enable_notifications: true,
	config_notification_timeout: 10,
	config_use_category_header: false,
	config_hard_coded_category: '',
	config_default_category: ''
};

var store = new Store( 'settings', defaultSettings );

function resetSettings()
{
	store.fromObject( defaultSettings );
}

//file size formatter - takes an input in bytes
function fileSizes(value, decimals)
{
	if(decimals == null) decimals = 2;
	kb = value / 1024
	mb = value / 1048576
	gb = value / 1073741824
	if (gb >= 1){
		return gb.toFixed(decimals)+"GB"
	} else if (mb >= 1) {
		return mb.toFixed(decimals)+"MB"
	} else {
		return kb.toFixed(decimals)+"KB"
	}
}

function updateBadge( data )
{
	if( data ) {
		var slots = data.queue.noofslots;
		var badge = {};
		if( !slots ) {
			badge.text = '';
		} else {
			badge.text = slots.toString();
		}
		chrome.browserAction.setBadgeText(badge);
	}
}

function isDownloading( kbpersec )
{
	return kbpersec && parseFloat( kbpersec ) > 1;
}

function updateBackground( data )
{
	if( data ) {
		var badgeColor = {}
		if( isDownloading( data.queue.kbpersec ) ) {
			badgeColor.color = new Array(0, 213, 7, 100);
		} else {
			badgeColor.color = new Array(255, 0, 0, 100);
		}
		
		chrome.browserAction.setBadgeBackgroundColor(badgeColor)
	}
}

function updateSpeedLog( data )
{
	var speedlog = [];
	
	var speedlogData = getPref( 'speedlog' );
	if( speedlogData )
	{
		speedlog = JSON.parse(getPref('speedlog'));
		
		// Only allow 10 values, if at our limit, remove the first value (oldest)
		while( speedlog.length >= 10 ) {
			speedlog.shift();
		}
	}
	
	speedlog.push( data ? parseFloat( data.queue.kbpersec ) : 0 );
	setPref( 'speedlog', JSON.stringify( speedlog ) );
}

function displayNotificationCallback( data )
{
	// Return early if data is null, which can happen if we
	// have invalid connection information in settings and
	// we actually can't establish a connection with sabnzbd.
	if( !data || data.error ) {
		return;
	}
	
	for (var i=0; i<data.history.slots.length; i++) {
		var dl = data.history.slots[i];
		var key = 'past_dl-' + dl.name + '-' + dl.bytes;
		if (typeof localStorage[key] == 'undefined') {
			console.log("Possible History notification:");
			console.log(dl);
			// Only notify when post-processing is complete
			if (dl.action_line == '') {
				if (dl.fail_message != '') {
					var fail_msg = dl.fail_message.split('<')[0];
					var notification = webkitNotifications.createNotification(
					  'images/sab2_48.png',
					  'Download Failed',
					  dl.name + ': ' + fail_msg
					);
				} else {
					var notification = webkitNotifications.createNotification(
					  'images/sab2_48.png',
					  'Download Complete',
					  dl.name
					);
				}
				notification.show();
				localStorage[key] = true;
				console.log("Notification posted!");
				
				var notifyTimeout = store.get( 'config_notification_timeout' );
				if( notifyTimeout !== '0' ) {
					console.log( "notifications_timeout set to " + notifyTimeout + " seconds" );
					setTimeout( function() { notification.cancel(); }, notifyTimeout * 1000 );
				}
			}
		}
	}
}

function fetchInfoSuccess( data, quickUpdate, callback )
{
	if( !data || data.error ) {
		setPref( 'error', data ? data.error : 'Success with no data?' );
		
		if( callback ) {
			callback();
		}
		
		return;
	}
	
	// This will remove the error
	// Will cause problems if the error pref is used elsewhere to report other errors
	setPref('error', '');
	setPref('timeleft', data ? data.queue.timeleft : '0' );
	
	if(data) {
		// Convert to bytes
		var bytesPerSec = parseFloat(data.queue.kbpersec)*1024;
		var speed = data.queue.speed + 'B/s';
	} else {
		var speed = '-';
	}
	setPref('speed', speed);
	
	// Do not run this on a quickUpdate (unscheduled refresh)
	if( !quickUpdate ) {
		updateSpeedLog( data );
	}
	
	var queueSize = '';
	if( data && data.queue.mbleft > 0 ) {
		// Convert to bytes
		var bytesInMegabyte = 1048576;
		var bytesLeft = data.queue.mbleft * bytesInMegabyte;
		var queueSize = fileSizes(bytesLeft);
	}
	setPref('sizeleft', queueSize);

	setPref('queue', data ? JSON.stringify(data.queue.slots) : '' );

	setPref( 'status', data ? data.queue.status : '' );
	setPref( 'paused', data ? data.queue.paused : '' );
	
	updateBadge( data );
	updateBackground( data );

	if( callback ) {
		callback();
	}
}

function fetchInfoError( XMLHttpRequest, textStatus, errorThrown, callback ) {
	setPref('error', 'Could not connect to SABnzbd - Check it is running, the details in this plugin\'s settings are correct and that you are running at least SABnzbd version 0.5!');
	
	if( callback ) {
		callback();
	}
}

function testConnection( callback )
{
	fetchInfo( true, callback );
}

/**
 * quickUpdate
 *	 If set to true, will not update the graph ect, currently used when a queue item has been moved/deleted in order to refresh the queue list
 */
function fetchInfo( quickUpdate, callback )
{
	sendSabRequest(
		'queue',
		'5',
		bind( fetchInfoSuccess, _1, quickUpdate, callback ),
		bind( fetchInfoError, _1, _2, _3, callback )
		);
}

function displayNotifications()
{
	if( store.get('config_enable_notifications') === true ) {
		sendSabRequest(
			'history',
			'10',
			displayNotificationCallback
			);
	}
}

function sendSabRequest( mode, limit, success_callback, error_callback )
{
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
	
	data.mode = mode;
	data.output = 'json';
	data.limit = limit;
	$.ajax({
		type: "GET",
		url: sabApiUrl,
		data: data,
		username: store.get('sabnzbd_username'),
		password: store.get('sabnzbd_password'),
		dataType: 'json',
		success: success_callback,
		error: error_callback
	});
}

function updatePopup()
{
	var views = chrome.extension.getViews({ type: "popup" });
	if( views.length == 1 )
	{
		var popup = views[0];
		popup.reDrawPopup();
	}
}

function refresh( quick, callback )
{
	if( !callback ) {
		callback = updatePopup;
	}
	
	fetchInfo( quick, callback );
	
	if( !quick ) {
		displayNotifications();
	}
}

var gTimer;
var globalContext = new Object();

$(document).ready(function() {
	globalContext.config = localStorage;
	startTimer();
});

function restartTimer()
{
	if( gTimer ) {
		clearInterval( gTimer );
	}
	
	startTimer();
}

function startTimer()
{
	var refreshRate = getRefreshRate();
	if( refreshRate > 0 ) {
	    console.log("Will refresh from SABnzbd every " + refreshRate + " ms.");
    	gTimer = setInterval( refresh, refreshRate );
	}
	else {
	    console.log("Will NOT refresh from SABnzbd automatically (refresh disabled in options).");
	}
}

function addToSABnzbd(cb, request) {
	var nzburl = request.nzburl;
	var mode = request.mode;
	var nzbname = request.nzbname;
	
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost(true);
	data.mode = mode;
	data.name = nzburl;
	data.output = 'json';
	if( nzbname ) {
		data.nzbname = nzbname;
	}
	
	// Only use auto-categorization if "Use X-DNZB-Category" is false (0), or if the index site doesn't support the X-DNZB-Category HTTP header
	var useCatHeader = store.get('config_use_category_header');
	console.log('use_category_header=');
	console.log( useCatHeader );
	if( useCatHeader !== false ) {
		var site_supports_category_header = false;
		for (var i=0; i<category_header_sites.length; i++) {
			if (nzburl.indexOf(category_header_sites[i]) != -1) {
				site_supports_category_header = true;
				break;
			}
		}
		console.log('site_supports_category_header=');
		console.log(site_supports_category_header);
	}
	if (useCatHeader === true || !site_supports_category_header) {
		var hardcodedCategory = store.get( 'config_hard_coded_category' );
		var defaultCategory = store.get( 'config_default_category' );
		
		if( hardcodedCategory.length !== 0 ) {
			data.cat = hardcodedCategory;
		} else if( request.category ) {
			data.cat = request.category;
		} else if( defaultCategory.length !== 0 ) {
			data.cat = defaultCategory;
		} 
	}

	$.ajax({
		type: "GET",
		url: sabApiUrl,
		cache: false,
		username : store.get( 'sabnzbd_username' ),
		password : store.get( 'sabnzbd_password' ),
		data: data,
		dataType: 'json',
		success: function() { cb({ret: 'success', data: data}) },
		error: function() { cb({ret: 'error'}) }
	});
	
	fetchInfo(true);
}

function refreshRateChanged()
{
	restartTimer();
}

function InitializeContentScript( request, callback )
{
	if( request.provider )
	{
		var setting = 'provider_' + request.provider;
		if( store.get( setting ) )
		{
			callback();
		}
	}
}

function GetSetting( request, callback )
{
	callback( store.get( request.name ) );
}

/**
* Handles data sent via chrome.extension.sendRequest().
* @param request Object Data sent in the request.
* @param sender Object Origin of the request.
* @param callback Function The method to call when the request completes.
*/
function onRequest( request, sender, callback )
{
	switch( request.action ) {
	case 'initialize':
		InitializeContentScript( request, callback );
		break;
	case 'get_setting':
		GetSetting( request, callback );
		break;
	case 'saveContext':
		globalContext = request.value;
		break;
	case 'addToSABnzbd':
		addToSABnzbd( callback, request );
		break;
	}
};

chrome.extension.onRequest.addListener( onRequest );