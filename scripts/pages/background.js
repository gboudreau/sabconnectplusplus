// List of sites that send the X-DNZB-Category HTTP header
//var category_header_sites = ['nzbs.org', 'newzbin2.es', 'newzxxx.com'];
var category_header_sites = [];

var defaultSettings = {
	sabnzbd_url: 'http://localhost:8080/',
	sabnzbd_api_key: '',
	sabnzbd_username: '',
	provider_binsearch: true,
	provider_bintube: true,
	provider_dognzb: true,
	provider_fanzub: true,
	provider_nzbclub: true,
	provider_nzbindex: true,
	provider_nzbsrus: true,
	provider_nzbx: true,
	provider_yubse: true,
	provider_omgwtfnzbs: true,
	provider_nzbrss: true,
	provider_newznab: 'your_newznab.com, some_other_newznab.com',
	use_name_binsearch: true,
	use_name_nzbindex: true,
	use_name_yubse: true,
	use_name_nzbx: true,
	config_refresh_rate: 15,
	config_enable_graph: true,
	config_enable_context_menu: true,
	config_enable_notifications: true,
	config_notification_timeout: 10,
    config_use_user_categories: false,
	config_use_category_header: false,
	config_hard_coded_category: '',
	config_default_category: '',
	config_enable_automatic_authentication: true,
	profiles: {},
	first_profile_initialized: false,
    active_category: '*',
    settings_synced: false
};

var store = new StoreClass( 'settings', defaultSettings, undefined, storeReady_background );

function storeReady_background() {
	startTimer();
	
	initializeBackgroundPage();
	
	//context_menu.js
	SetupContextMenu();
}

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
	if(data.queue.paused) {
		setPref("pause_int", data.queue.pause_int);
	}
	
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

function testConnection( profileValues, callback )
{
	fetchInfo( true, callback, profileValues );
}

/**
 * quickUpdate
 *	 If set to true, will not update the graph ect, currently used when a queue item has been moved/deleted in order to refresh the queue list
 */
function fetchInfo( quickUpdate, callback, profileValues )
{
	var params = {
		mode: 'queue',
		limit: '5'
	};
	
	sendSabRequest(
		params,
		function(data) { fetchInfoSuccess( data, quickUpdate, callback ) },
		function(_1, _2, _3) { fetchInfoError( _1, _2, _3, callback ) },
		profileValues
		);
}

function displayNotifications()
{
	if( store.get('config_enable_notifications') === true ) {
		var params = {
			mode: 'history',
			limit: '10'
		};
		
		sendSabRequest( params, displayNotificationCallback );
	}
}

function setMaxSpeed( speed, success_callback, error_callback )
{
	var params = {
		mode: 'config',
		name: 'speedlimit',
		value: speed
	};
	
	sendSabRequest( params, success_callback, error_callback );
}

function getMaxSpeed( success_callback )
{
	var params = {
		mode: 'config',
		name: 'get_speedlimit'
	};
	
	sendSabRequest( params, success_callback );
}

function sendSabRequest( params, success_callback, error_callback, profileValues )
{
	var profile = profileValues || activeProfile();
	
	var sabApiUrl = constructApiUrl( profile );
	var data = constructApiPost( profile );
	data.output = 'json';
	
	$.ajax({
		type: "GET",
		url: sabApiUrl,
		data: combine( data, params ),
		username: profile.username,
		password: profile.password,
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

function DoesSiteSupportCatHeader( nzburl )
{
	var supported = false;
	for (var i=0; i<category_header_sites.length; i++) {
		if (nzburl.indexOf(category_header_sites[i]) != -1) {
			supported = true;
			break;
		}
	}
	
	console.log( 'site_supports_category_header = ' + supported );
	return supported;
}

function DoesSABHandleCategoryForSite( nzburl )
{
    // SABnzbd only handle categories for NZBMatrix at this time
    return nzburl.indexOf('nzbmatrix') != -1;
}

function SetupCategoryHeader( request, data, nzburl )
{
	// Only use auto-categorization if "Use X-DNZB-Category" is false (0), or if the index site doesn't support the X-DNZB-Category HTTP header
	var useCatHeader = store.get('config_use_category_header');
	console.log( 'config_use_category_header = ' + useCatHeader );

    var useUserCats = store.get('config_use_user_categories');
	
	if( !useCatHeader || !DoesSiteSupportCatHeader( nzburl ) ) {
        if (!useUserCats) {
            var hardcodedCategory = store.get( 'config_hard_coded_category' );
            var defaultCategory = store.get( 'config_default_category' );
            
            if( hardcodedCategory ) {
                data.cat = hardcodedCategory;
            } else if( request.category ) {
                data.cat = request.category;
            } else if( defaultCategory && !DoesSABHandleCategoryForSite( nzburl )) {
                data.cat = defaultCategory;
            }
        }
        else
        {
            data.cat = store.get('active_category');
        }
	}
}

function addToSABnzbd( request, sendResponse ) {
	var nzburl = request.nzburl;
	var mode = request.mode;
	var nzbname = request.nzbname;
	
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
	data.mode = mode;
	data.name = nzburl;
	data.output = 'json';
	if( nzbname ) {
		data.nzbname = nzbname;
	}
	
	SetupCategoryHeader( request, data, nzburl );

	$.ajax({
		type: "GET",
		url: sabApiUrl,
		cache: false,
		username : activeProfile().username,
		password : activeProfile().password,
		data: data,
		dataType: 'json',
		success: function() { sendResponse( {ret: 'success', data: data } ); },
		error: function() { sendResponse( {ret: 'error' } ); }
	});
	
	fetchInfo(true);
}

function refreshRateChanged()
{
	restartTimer();
}

function InitializeContentScript( request, response )
{
	if( request.provider ) {
		var setting = 'provider_' + request.provider;
		response.enabled = store.get( setting );
	}
}

function GetSetting( request, response )
{
	response.value = store.get( request.setting );
}

function SetSetting( request, response )
{
	store.set( request.setting, request.value );
	response.value = true;
}

function OnRequest( request, sender, sendResponse )
{
	var response = {
		response: request.action
	}
	
	switch( request.action ) {
	case 'initialize':
		InitializeContentScript( request, response );
		break;
	case 'set_setting':
		SetSetting( request, response );
		break;
	case 'get_setting':
		GetSetting( request, response );
		break;
	case 'addToSABnzbd':
		addToSABnzbd( request, sendResponse );
		return true; // return true to be able to receive a response after this function returns.
	case 'get_categories':
		var params = {
		action: 'sendSabRequest',
		mode: 'get_cats'
		}
		sendSabRequest(params, sendResponse);
		return true;
	}
	
	sendResponse( response );
}

/// This function is limited usefulness and will be removed in
/// a future version.
function getOldProfileValues()
{
	return {
		'url': store.get( 'sabnzbd_url' ),
		'api_key': store.get( 'sabnzbd_api_key' ),
		'username': store.get( 'sabnzbd_username' ),
		'password': store.get( 'sabnzbd_password' )
	}
}

/// This function is limited usefulness and will be removed in
/// a future version. This takes the current connection info
/// and creates a default profile out of it for users updating to
/// version 0.5.6
function setupFirstTimeDefaultProfile()
{
	try {
		profiles.add( 'Default', getOldProfileValues() );
		profiles.setActiveProfile("Default");
	}
	catch( e ) {
		if( e == 'already_exists' ) {
			alert( 'Default profile already exists for some reason. File a bug report on our Google Code page about this please.' );
		}
		else {
			throw e;
		}
	}
}

function initializeProfile()
{
	var firstProfileInitialized = store.get( 'first_profile_initialized' );
	if( !firstProfileInitialized ) {
		setupFirstTimeDefaultProfile();
		store.set( 'first_profile_initialized', true );
		return;
	}
	
	var profile = profiles.getActiveProfile();
	if( !profile ) {
		// For some reason the active profile does not exist
		console.warn( 'Last saved active profile was not found in the list of existing profiles. A new active profile was chosen.' );
		
		profile = profiles.getFirstProfile();
		if( profile ) {
			profiles.setActiveProfile( profile.name );
		}
	}
}

function initializeBackgroundPage()
{
	chrome.extension.onMessage.addListener( OnRequest );

    // Migration from localStorage to chrome.storage.sync
	var settingsSynced = store.get( 'settings_synced' );
	if( !settingsSynced ) {
	    console.log("Need to migrate settings to synced-setings.")
	    // Didn't yet migrate old settings to synced-settings
		var oldStore = new Store( 'settings', defaultSettings, undefined, function(){
		    oldStore.toObject(function(o){
                for (var key in o) {
                    var value = localStorage.getItem("store.settings." + key);
                    if (value !== null) {
                        value = JSON.parse(value);
                	    console.log("Migrating " + key + " = " + value);
                        store.set( key, value );
                    }
        		}
        		store.set( 'settings_synced', true );
		    });
		});
	}

	initializeProfile();
}


