var nzbxxx_apikey;
var nzbxxx_username;

function findNZBId(elem) {
	var url = $(elem).attr('href');

	var hostname = window.location.href.substr(0, window.location.href.indexOf('/', 8));
	if( hostname.indexOf('nzbxxx') != -1 ) {
		var nzbid = 0;
		
		var matches = url.match( /id\=(\d+)\&/i );
		if( matches.length > 1 ) {
			nzbid = matches[1];
		}
		
		url = 'http://api.nzbxxx.com/v1.1/download.php?id=' + nzbid + '&username=' + nzbxxx_username + '&apikey=' + nzbxxx_apikey;
		//url += '&apikey=' + nzbxxx_apikey + '&username=' + nzbxxx_username;
	}
	else {
		url = url.replace('nzb-download', '/nzb-details');
		
		if( url.indexOf(hostname) == -1 ) {
			url = hostname + url
		}
	}

	return url;
}

function addToSABnzbdFromNZBMatrix() {
	// Find the newzbin id from the href
	var nzbid = findNZBId(this);
	if (nzbid) {
		// Set the image to an in-progress image
		var img = chrome.extension.getURL('images/sab2_16_fetching.png');
		$(this).find('img').attr("src", img);
		var addLink = this;
		
		addToSABnzbd(addLink, nzbid, "addurl");
	}

	return false;
}

function handleAllDownloadLinks() {
	// On search results (tabulated) pages:
	$('img[title="Download NZB"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");
		
		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).attr("src", img);

		// Change the on click handler to send to sabnzbd
		// this is the <img>, parent is the <a>
		$(this).parent().click(addToSABnzbdFromNZBMatrix);
	});
	
	// On details pages:
	$('img[src="images/new_downloadnzb.gif"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");

		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).attr("src", img);

		// Change the on click handler to send to sabnzbd
		// this is the <img>, parent is the <a>
		$(this).parent().click(addToSABnzbdFromNZBMatrix);

		$(this).parent().addClass("downloadButton");

		var bg_img = chrome.extension.getURL('images/nzbmatrix_button.gif');
		$(this).parent()[0].innerHTML = '<span class="downloadButton" style="background-image: url('+bg_img+')"><img src="'+img+'" title="Send to SABnzbd" valign="middle" /> <span class="text">Send to SABnzbd</span></span>';

	});
}

function RefreshSettings()
{
	GetSetting( 'nzbxxx_api_key', function( value ) {
		nzbxxx_apikey = value;
	});
	
	GetSetting( 'nzbxxx_username', function( value ) {
		nzbxxx_username = value
	});
}

Initialize( 'nzbmatrix', RefreshSettings, function() {
	handleAllDownloadLinks();
});