function getNzbId(elem) {
	var match = /&id=([0-9a-zA-Z]{5})/i.exec(elem);	
	
	if (typeof match != 'undefined' && match != null) {
		var nzbId = match[1];
		return nzbId;
	} else {
		return null;
	}
}

function getUserName() {
	return $("a[href='/account']").html();
}

function getApiKey() {
	var protocol = 'http';
	
	if (window.location.href.indexOf('https') == 0) {
		protocol = 'https';
	}
			
	var apiHtml = $.ajax({url: protocol + "://omgwtfnzbs.org/account.php?action=api", async: false}).responseText;
	var apiKey = $(apiHtml).find('font[color="Orange"]').html();
	
	if (apiKey != null) {	
		return apiKey;
	} else {
		return null;
	}
}

function addToSABnzbdFromOmgwtfnzbs() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);
    
    var nzburl = $(this).attr('href');	
    var addLink = this;	
	var url = "http://api.omgwtfnzbs.org/sn.php?";
	
	if (nzburl.indexOf('https://') == 0) {
		url = "https://api.omgwtfnzbs.org/sn.php?";
	}
	
	// Get the NZB ID
	url = url + 'id=' + getNzbId(nzburl) + '&user=' + getUserName() + '&api=' + getApiKey();
		
    addToSABnzbd(addLink, url, "addurl");
    
    return false;	
}

function handleAllDownloadLinks() {	
	$('img[src="pics/dload.gif"]').each(function() {		
		var href = $(this).parent().attr('href');
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var link_mini = '<a class="addSABnzbd" href="' + href + '" style="vertical-align: middle;"><img border="0" src="' + img + '" title="Send to SABnzbd" style="position:relative;margin-top:5px;width:16px;" /></a>&nbsp;';
		var link_full = '<a class="addSABnzbd linky" href="' + href + '"><img border="0" src="' + img + '" title="Send to SABnzbd" /> Send to SABnzbd</a>&nbsp;';
				
		if ($(this).parent().hasClass('linky') === false) {			
			$(this).parent().before(link_mini);
		} else {
			$(this).parent().before(link_full);
		}		
	});

	// Change the on click handler to send to sabnzbd
	// moved because the way it was the click was firing multiple times
	$('.addSABnzbd').each(function() {
		$(this).click(addToSABnzbdFromOmgwtfnzbs);
	});	
	
	return;
}

Initialize( 'omgwtfnzbs', null, function() {
	handleAllDownloadLinks();
});