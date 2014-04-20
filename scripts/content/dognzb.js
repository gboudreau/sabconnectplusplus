var nzburl;
var addLink;
var category = null;

function findNZBId(elem) {
	nzbid = $(elem).attr('id');
	url = '/fetch/' + nzbid;
	return url;
}

function addToSABnzbdFromDognzb() {
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
    			category = tr.find('span[class~="labelstyle-444444"]').text();

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

			var tr = $(this).parent().parent();
			category = tr.find('span[class~="labelstyle-444444"]').text();

			addLink = this;
			

			// Add the authentication to the link about to be fetched
			nzburl += '/' + rss_hash;

			addToSABnzbd(addLink, nzburl, "addurl", null, category);

			return false;
		}
	}
}

function handleAllDownloadLinks() {
       //XXX: Needs to be fixed with new site layout
       // List view: add a button above the list to send selected NZBs to SAB
       //$('input[class="nzb_multi_operations_sab"]').each(function() {
       //	$(this).css('display', 'inline-block');
       //	$(this).click(addToSABnzbdFromDognzb);
       //});

	$('div[class="dog-icon-download"]').not('.sabcpp-fake-godnzb-marker').each(function() {
		// Change the title to "Send to SABnzbd"
		newlink = $('<div></div>').attr("title", "Send to SABnzbd");
		newlink.addClass('dog-icon-download').addClass('sabcpp-fake-dognzb-marker');

		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		newlink.css('background-image', 'url('+img+')');
		newlink.css('background-position', '0 0');
		
		// Extract NZB id from onClick and set to ID attribute
		
		var nzbid = $(this).attr('onClick');
		var nzbid = nzbid.split('\'')[1];
		newlink.attr("id", nzbid);

		// Change the on click handler to send to sabnzbd
		// this is the <a>
		//$(this).removeAttr("onClick");
		newlink.click(addToSABnzbdFromDognzb);
		$(this).replaceWith(newlink);
	});
}

Initialize( 'dognzb', null, function() {
	handleAllDownloadLinks();
	sabcppDogCheck = function(){
		if($('div[class="dog-icon-download"]').not('.sabcpp-fake-godnzb-marker').length >= 1) {
			handleAllDownloadLinks();
		}
		setTimeout(sabcppDogCheck, 1000);
	};
        setTimeout(sabcppDogCheck, 1000);
});
