var ignoreCats;

function onResponseAdd( response, addLink )
{
	switch( response.ret ) {
	case 'error' :
		alert("Could not contact SABnzbd \n Check it is running and your settings are correct");
		var img = chrome.runtime.getURL('images/content_icon_error.png');
		if ($(addLink).find('img').length > 0) {
			$(addLink).find('img').attr("src", img);
		} else {
			// Prevent updating the background image of Bootstrap buttons
			if ($(addLink).hasClass('btn') == false) { 
				$(addLink).css('background-image', 'url('+img+')');
			}
		}
		break;
	case 'success':
		// If there was an error of some type, report it to the user and abort!
		if (response.data.error) {
			alert(response.data.error);
			var img = chrome.runtime.getURL('images/content_icon_error.png');
			if ($(addLink).find('img').length > 0) {
				$(addLink).find('img').attr("src", img);
			} else {
				// Prevent updating the background image of Bootstrap buttons
				if ($(addLink).hasClass('btn') == false) {
					$(addLink).css('background-image', 'url('+img+')');
				}
			}
			return;
		}
		var img = chrome.runtime.getURL('images/content_icon_success.png');
		if ($(addLink).find('img').length > 0) {
			$(addLink).find('img').attr("src", img);
		} else if (addLink.nodeName && addLink.nodeName.toUpperCase() == 'INPUT' && addLink.value == 'Sent to SABnzbd!') {
			// Nothing; handled in nzbsorg.js
		} else {
			// Prevent updating the background image of Bootstrap buttons
			if ($(addLink).hasClass('btn') == false) { 
				$(addLink).css('background-image', 'url('+img+')');
			}
		}
		break;
	default:
		alert("SABconnect: Oops! Something went wrong. Try again.");
	}
}

function addToSABnzbd(addLink, nzburl, mode, nice_name, category) {
	
	if(nzburl.substring(0, 1) == "/") {
		var locHost = window.location.host;
		if (locHost == "dognzb.cr") {
			locHost = "dl.dognzb.cr";
		}
		nzburl = window.location.protocol + "//" + locHost + nzburl;
	}
	
	var request = {
		action: 'addToSABnzbd',
		nzburl: nzburl,
		mode: mode
	};
	
	if (typeof nice_name != 'undefined' && nice_name != null) {
		request.nzbname = nice_name;
	}

	GetSetting('config_ignore_categories', function( value ) {
		ignoreCats = value;
	});
	if (!ignoreCats && typeof category != 'undefined' && category != null) {
		request.category = category;
	}
	
	console.log("Sending to SABnzbd:");
	console.log(request);
	
	chrome.runtime.sendMessage(
		request,
		function(response) { onResponseAdd( response, addLink ) }
		);
}

function GetSetting( setting, callback )
{
	var request = {
		action: 'get_setting',
		setting: setting
	}
	
	chrome.runtime.sendMessage( request, function( response ) {
		var value = response.value;
		
		if( typeof value == 'undefined' || value == null ) {
			throw 'GetSetting(): ' + setting + ' could not be found.';
		}
		else {
			callback( value );
		}
	});
}

var refresh_func = null;

function CallRefreshFunction()
{
	if( refresh_func ) {
		refresh_func();
	}
}

function Initialize( provider, refresh_function, callback )
{
	var request = {
		action: 'initialize',
		provider: provider
	}
		
	chrome.runtime.sendMessage( request, function( response ) {
		if( response.enabled ) {
			callback();
		}
		else {
			console.info( 'SABconnect: 1-click functionality for this site is disabled' );
		}
	});
	
	refresh_func = refresh_function
	CallRefreshFunction();
}

function OnRequest( request, sender, onResponse )
{
	switch( request.action ) {
	case 'refresh_settings':
		CallRefreshFunction();
		break;
	}
};

chrome.runtime.onMessage.addListener( OnRequest );
