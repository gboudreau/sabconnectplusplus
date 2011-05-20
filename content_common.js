
function onResponseAdd( response, addLink )
{
	switch( response.ret ) {
	case 'error' :
		alert("Could not contact SABnzbd \n Check it is running and your settings are correct");
		var img = chrome.extension.getURL('images/sab2_16_red.png');
		if ($(this).find('img').length > 0) {
			$(addLink).find('img').attr("src", img);
		} else {
			$(addLink).css('background-image', 'url('+img+')');
		}
		break;
	case 'success':
		// If there was an error of some type, report it to the user and abort!
		if (response.data.error) {
			alert(response.data.error);
			var img = chrome.extension.getURL('images/sab2_16_red.png');
			if ($(this).find('img').length > 0) {
				$(addLink).find('img').attr("src", img);
			} else {
				$(addLink).css('background-image', 'url('+img+')');
			}
			return;
		}
		var img = chrome.extension.getURL('images/sab2_16_green.png');
		if ($(addLink).find('img').length > 0) {
			$(addLink).find('img').attr("src", img);
		} else if (addLink.nodeName && addLink.nodeName.toUpperCase() == 'INPUT' && addLink.value == 'Sent to SABnzbd!') {
			// Nothing; handled in nzbsorg.js
		} else {
			$(addLink).css('background-image', 'url('+img+')');
		}
		break;
	default:
		alert("Oops! Something went wrong. Try again.");
	}
}

function addToSABnzbd(addLink, nzburl, mode, nice_name, category) {
	
	var req = {
		action: 'addToSABnzbd',
		nzburl: nzburl,
		mode: mode
	};
	
	if (typeof nice_name != 'undefined' && nice_name != null) {
		req.nzbname = nice_name;
	}

	if (typeof category != 'undefined' && category != null) {
		req.category = category;
	}
	
	console.log("Sending to SABnzbd:");
	console.log(req);

	chrome.extension.sendRequest( req, bind( onResponseAdd, _1, addLink ) );
}