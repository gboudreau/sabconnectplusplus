
// List of sites that send the X-DNZB-Category HTTP header
var category_header_sites = ['nzbs.org', 'newzbin.com', 'newzxxx.com'];
var no_category_header_sites = ['nzbmatrix.com', 'binsearch', 'nzbindex', 'nzbsrus', 'newzleech', 'nzbclub', 'fanzub.com'];

function setDefaults()
{
	if(!getPref('sab_url')) setPref('sab_url', 'http://localhost:8080/sabnzbd/');
	if(!getPref('api_key')) setPref('api_key', '');
	if(!getPref('http_user')) setPref('http_user', '');
	if(!getPref('http_pass')) setPref('http_pass', '');
	if(!getPref('hardcoded_category')) setPref('hardcoded_category', '');
	if(!getPref('default_category')) setPref('default_category', '');
	if(!getPref('speedlog')) setPref('speedlog', JSON.stringify([]));
	if(getPref('show_graph') == null) setPref('show_graph', 0);
	if(getPref('show_notifications') == null) setPref('show_notifications', 1);
	if(getPref('notifications_timeout') == null) setPref('notifications_timeout', 0);
	if(getPref('use_category_header') == null) setPref('use_category_header', 0);
	if(getPref('enable_newzbin') == null) setPref('enable_newzbin', 1);
	if(getPref('enable_nzbmatrix') == null) setPref('enable_nzbmatrix', 1);
	if(getPref('enable_nzbclub') == null) setPref('enable_nzbclub', 1);
	if(getPref('enable_bintube') == null) setPref('enable_bintube', 1);
	if(getPref('enable_newzleech') == null) setPref('enable_newzleech', 1);
	if(getPref('enable_nzbsorg') == null) setPref('enable_nzbsorg', 1);
	if(getPref('enable_binsearch') == null) setPref('enable_binsearch', 1);
	if(getPref('enable_nzbindex') == null) setPref('enable_nzbindex', 1);
	if(getPref('enable_nzbsrus') == null) setPref('enable_nzbsrus', 1);
	if(getPref('enable_nzbdotsu') == null) setPref('enable_nzbdotsu', 1);
	if(getPref('enable_fanzub') == null) setPref('enable_fanzub', 1);
	if(getPref('use_nice_name_nzbindex') == null) setPref('use_nice_name_nzbindex', 1);
	if(getPref('use_nice_name_binsearch') == null) setPref('use_nice_name_binsearch', 1);
 
	// Force this back to 0 just incase
	setPref('skip_redraw', 0);
	
	setPref('refresh_rate_default', 15);
	if(getPref('refresh_rate') == null) setPref('refresh_rate', getPref('refresh_rate_default'));
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
		if( slots && slots == 0 ) {
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
	//console.log("!quickUpdate")
	var speedlog = JSON.parse(getPref('speedlog'));
	
	// Only allow 10 values, if at our limit, remove the first value (oldest)
	while( speedlog.length >= 10 ) {
		speedlog.shift();
	}
	
	speedlog.push( data ? parseFloat( data.queue.kbpersec ) : 0 );
	setPref( 'speedlog', JSON.stringify( speedlog ) );
}

function displayNotificationCallback( data )
{
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
					  'images/sab2_64.png',
					  'Download Failed',
					  dl.name + ': ' + fail_msg
					);
				} else {
					var notification = webkitNotifications.createNotification(
					  'images/sab2_64.png',
					  'Download Complete',
					  dl.name
					);
				}
				notification.show();
				localStorage[key] = true;
				console.log("Notification posted!");
				
				if (getPref('notifications_timeout') != '0') {
					console.log("notifications_timeout set to " + getPref('notifications_timeout') + " seconds");
					setTimeout(function() { notification.cancel(); }, getPref('notifications_timeout') * 1000);
				}
			}
		}
	}
}

function fetchInfoSuccess( data, quickUpdate, callback )
{
	// If there was an error of some type, report it to the user and abort!
	if( data != null && data.error ) {
		setPref('error', data.error);
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
	
	updateBadge();
	updateBackground();
	
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
	if( getPref('show_notifications') == '1' ) {
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
		username: getPref('http_user'),
		password: getPref('http_pass'),
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
	setDefaults();
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
	    console.log("Will refresh from SABnzbd every " + refreshRate + " seconds.");
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
	if (request.nzbname) {
		data.nzbname = request.nzbname;
	}
	
	// Only use auto-categorization if "Use X-DNZB-Category" is false (0), or if the index site doesn't support the X-DNZB-Category HTTP header
	console.log('use_category_header=');
	console.log(getPref('use_category_header'));
	if (getPref('use_category_header') != '0') {
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
	if (getPref('use_category_header') == '0' || !site_supports_category_header) {
		if (getPref('hardcoded_category') != '') {
			data.cat = getPref('hardcoded_category');
		} else if (request.category) {
			data.cat = request.category;
		} else if (getPref('default_category') != '') {
			data.cat = getPref('default_category');
		} 
	}

	$.ajax({
		type: "GET",
		url: sabApiUrl,
		cache: false,
		username : getPref('http_user'),
		password : getPref('http_pass'),
		data: data,
		dataType: 'json',
		success: function() { cb({ret: 'success', data: data}) },
		error: function() { cb({ret: 'error'}) }
	});
	
	fetchInfo(true);
}

function reloadConfig()
{
	globalContext.config = localStorage;
}

function refreshRateChanged()
{
	restartTimer();
}

/**
* Handles data sent via chrome.extension.sendRequest().
* @param request Object Data sent in the request.
* @param sender Object Origin of the request.
* @param sendResponse Function The method to call when the request completes.
*/
function onRequest(request, sender, sendResponse) {
	switch(request.action) {
		case 'getContext':
			sendResponse({value: globalContext});
			return;
		case 'saveContext':
			globalContext = request.value;
			return;
		case 'addToSABnzbd':
			addToSABnzbd(sendResponse, request);
			return;
	}
	
	sendResponse({});
};

chrome.extension.onRequest.addListener( onRequest );