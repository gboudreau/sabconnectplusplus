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
		} else if ($(addLink).find('i').length > 0) {
			// Handle Font Awesome icons (e.g., DogNZB)
			var icon = $(addLink).find('i');
			if (icon.hasClass('fa-spinner') && icon.hasClass('fa-spin')) {
				icon.removeClass('fa-spinner').removeClass('fa-spin').addClass('fa-check');
			}
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

	// Always pass the category from the site if provided
	// The background script will decide whether to use it or the hard-coded one
	if (typeof category != 'undefined' && category != null) {
		request.category = category;
	}
	
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
		console.log('SABconnect++ Initialize: Received response:', response);
		if( response && response.enabled ) {
			callback();
		}
		else {
			console.info( 'SABconnect: 1-click functionality for this site is disabled or no response received' );
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

// Fallback function to find and add icons to download links
function addIconsWithFallback(options) {
	options = options || {};
	var linkSelector = options.linkSelector || 'a[href*="/download/"], a[href*=".nzb"], a[href*="/getnzb/"]';
	var iconClass = options.iconClass || 'addSABnzbd';
	var processedAttr = options.processedAttr || 'x-sab-processed';
	var iconStyle = options.iconStyle || 'margin-right: 5px;';
	var clickHandler = options.clickHandler || function(e) {
		e.preventDefault();
		e.stopPropagation();
		var $link = $(this);
		var href = $link.attr('href');
		addToSABnzbd(this, href, 'addurl', null, null);
		return false;
	};
	
	var oneClickImgTag = '<img style="vertical-align:baseline" src="' + chrome.runtime.getURL('/images/content_icon.png') + '" title="Send to SABnzbd" />';
	var addedCount = 0;
	
	$(linkSelector).each(function() {
		var $link = $(this);
		
		// Skip if already processed
		if ($link.attr(processedAttr) === 'true' || $link.hasClass(iconClass)) {
			return;
		}
		
		// Skip if parent already has our icon
		if ($link.parent().find('.' + iconClass).length > 0) {
			return;
		}
		
		// Mark as processed
		$link.attr(processedAttr, 'true');
		
		// Create and insert icon
		var $iconLink = $('<a class="' + iconClass + '" ' + processedAttr + '="true" href="' + $link.attr('href') + '" style="' + iconStyle + '">' + oneClickImgTag + '</a>');
		$link.before($iconLink);
		$iconLink.on('click', clickHandler);
		
		addedCount++;
	});
	
	if (addedCount > 0) {
		console.log('SABconnect++ Fallback: Added ' + addedCount + ' icons');
	} else {
		// If still no links found, log what we see
		console.log('SABconnect++ Fallback: No matching links found with selector:', linkSelector);
		console.log('SABconnect++ Fallback: Total anchors on page:', $('a').length);
		
		// Log first few link hrefs for debugging
		$('a').slice(0, 5).each(function(i) {
			console.log('SABconnect++ Fallback: Link ' + i + ':', $(this).attr('href'));
		});
	}
	
	return addedCount;
}
