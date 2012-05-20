var nzburl;
var addLink;
var category = null;

function findNZBId(elem) {
	nzbid = $(elem).attr('id');
	console.log('nzbid = ' + nzbid);
	url = 'http://dognzb.cr/fetch/' + nzbid;
	console.log('url = ' + url);

	return url;
}

function addToSABnzbdFromNewznab() {
	var rss_hash = $('input[name="rsstoken"]').val();
	if (this.nodeName.toUpperCase() == 'INPUT') {
		this.value = "Sending...";
		$(this).css('color', 'green');

	    $('table.data input:checked').each(function() {
			var tr = $(this).parent().parent();
			var a = tr.find('a[title="Send to SABnzbd"]');

			// Find the nzb id from the href
			nzburl = findNZBId(a);
			if (nzburl) {
				category = null;

				addLink = a;

				// Add the authentication to the link about to be fetched
				nzburl += '/' + rss_hash;

				addToSABnzbd(addLink, nzburl, "addurl", null, category);
			}
		});
		this.value = 'Sent to SAB!';
		$(this).css('color', 'red');
		sendToSabButton = this;
		
		setTimeout(function(){ sendToSabButton.value = 'Send to SAB'; $(sendToSabButton).css('color', '#888'); }, 4000);

		return false;
	} else {
		// Find the newzbin id from the href
		nzburl = findNZBId(this);
		if (nzburl) {
			// Set the image to an in-progress image
			var img = chrome.extension.getURL('images/sab2_16_fetching.png');
			$(this).css('background-image', 'url('+img+')');

			category = null;

			addLink = this;
			

			// Add the authentication to the link about to be fetched
			nzburl += '/' + rss_hash;

			addToSABnzbd(addLink, nzburl, "addurl", null, category);

			return false;
		}
	}
}

function handleAllDownloadLinks() {
	// List view: add a button above the list to send selected NZBs to SAB
	$('input[class="nzb_multi_operations_sab"]').each(function() {
		$(this).css('display', 'inline-block');
		$(this).click(addToSABnzbdFromNewznab);
    });

	$('div[title="Download NZB"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");

		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).css('background-image', 'url('+img+')');
		$(this).css('background-position', '0 0');
		
		// Extract NZB id from onClick and set to ID attribute
		
		var nzbid = $(this).attr('onClick');
		var nzbid = nzbid.split('\'')[1];
		$(this).attr("id", nzbid);

		// Change the on click handler to send to sabnzbd
		// this is the <a>
		$(this).removeAttr("onClick");
		$(this).click(addToSABnzbdFromNewznab);
	});
}

Initialize( 'nzb', null, function() {
	handleAllDownloadLinks();
});