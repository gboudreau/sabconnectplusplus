var nzburl;
var addLink;
var category = null;

function findNZBId(elem) {
	var url = $(elem).attr('href');
	var baseurl = window.location.protocol + '//' + window.location.host;
	var nzbid = url.substr(url.indexOf('/getnzb/')+8);
	if (nzbid.indexOf('/') != -1) {
		nzbid = nzbid.substr(0, nzbid.indexOf('/'));
	}
	url = baseurl + '/getnzb/' + nzbid + '.nzb';

	return url;
}

function addToSABnzbdFromNewznab() {
	if (this.nodeName.toUpperCase() == 'INPUT') {
		var new_txt = this.value.replace('Send', 'Sent');
		this.value = "Sending...";
		$(this).css('color', 'green');

		var user = $('input[name="UID"]').val();
		var rss_hash = $('input[name="RSSTOKEN"]').val();

	    $('table.data input:checked').each(function() {
			var tr = $(this).parent().parent();
			var a = tr.find('a[title="Send to SABnzbd"]');

			// Find the nzb id from the href
			nzburl = findNZBId(a);
			if (nzburl) {
				category = null;
				try {
					category = tr.find('a[href*="/browse?"]')[1].innerText.replace(' > ', '.');
				} catch (ex) { }

				addLink = a;

				// Add the authentication to the link about to be fetched
				nzburl += '?i=' + user + '&r=' + rss_hash;
				// TODO: make this optional
				nzburl += '&del=1';

				addToSABnzbd(addLink, nzburl, "addurl", null, category);
				this.checked = false;
			}
		});
		this.value = new_txt;
		$(this).css('color', 'red');
		sendToSabButton = this;
		
		setTimeout(function(){ sendToSabButton.value = sendToSabButton.value.replace('Sent', 'Send'); $(sendToSabButton).css('color', '#888'); }, 4000);

		return false;
	} else {
		// Find the newzbin id from the href
		nzburl = findNZBId(this);
		if (nzburl) {
			// Set the image to an in-progress image
			var img = chrome.extension.getURL('images/sab2_16_fetching.png');
			$(this).css('background-image', 'url('+img+')');

			category = null;
			if ($('#nzb_multi_operations_form').length == 0) {
				category = $(this).parent().parent().parent().parent().find('a[href*="/browse?"]')[1].innerText.replace(' > ', '.');
			} else {
				try {
					category = $(this).parent().parent().parent().find('a[href*="/browse?"]')[1].innerText.replace(' > ', '.');
				} catch (ex) { }
			}

			addLink = this;

			var user = $('input[name="UID"]').val();
			var rss_hash = $('input[name="RSSTOKEN"]').val();

			// Add the authentication to the link about to be fetched
			nzburl += '?i=' + user + '&r=' + rss_hash;
			// TODO: make this optional
			nzburl += '&del=1';

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
	$('.nzb_multi_operations_cart').each(function() {
		var button = '<input type="button" name="sab" value="Send to SABnzbd" class="submit" />';
		$(this).after(button);
		$(this).parent().find('input[name="sab"]').first().click(addToSABnzbdFromNewznab);
	});

	$.merge($('a[title="Download Nzb"]'), $('a[title="Download NZB"]')).each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");

		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).parent().css('background-image', 'url('+img+')');

		// Change the on click handler to send to sabnzbd
		// this is the <a>
		$(this).click(addToSABnzbdFromNewznab);
	});
}

Initialize( 'nzb', null, function() {
	handleAllDownloadLinks();
});
