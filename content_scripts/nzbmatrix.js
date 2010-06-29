function findNZBId(elem) {
	var url = $(elem).attr('href');

	// 0.5a6 needs nzb-details not nzb-download in url
	url = url.replace('nzb-download', 'nzb-details');
	
	if (url.indexOf('http://nzbmatrix.com') == -1) {
		url = 'http://nzbmatrix.com' + url
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

chrome.extension.sendRequest({'action' : 'getContext'}, function(response){
	if (response.value.config.enable_nzbmatrix == "0") {
		return;
	}
	handleAllDownloadLinks();
});