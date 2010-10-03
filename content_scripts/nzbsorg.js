// Scrape the users userid and hash to add to download links
var rssURL = $('link[title="RSS 1.0"]').attr('href');
// These will fail if nzbs.org changes the RSS feed at all
var match = /i=([^&]*)/i.exec(rssURL);
var user = match[1];
var match = /h=([^&]*)/i.exec(rssURL);
var hash = match[1];
var sendToSabButton;

//http://nzbs.org/index.php?action=getnzb&nzbid=307942
function addToSABnzbdFromNZBORG() {
	var addLink = this;
    var url = 'http://nzbs.org/';
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	if ($(this).find('img').length > 0) {
		$(this).find('img').attr("src", img);

		// Find the nzbs.org download URL
		var nzburl = url.concat($(this).attr('href'));
	} else if (this.nodeName.toUpperCase() == 'INPUT') {
		this.value = "Sending...";
		$(this).css('color', 'green');

	    $('tr.selected input:checked').each(function() {
			var nzbid = this.value;
			var nzburl = url + '?action=getnzb&nzbid=' + nzbid;
			nzburl += '&i=' + user;
			nzburl += '&h=' + hash;
			addToSABnzbd(addLink, nzburl, "addurl");
		});
		this.value = 'Sent to SABnzbd!';
		$(this).css('color', 'red');
		sendToSabButton = this;
		
		setTimeout(function(){ sendToSabButton.value = 'Send to SABnzbd'; $(sendToSabButton).css('color', 'black'); }, 4000);

		return false;
	} else {
		$(this).css('background-image', 'url('+img+')');

		// Find the nzbs.org download URL
		var nzbid = $(this).parent().find('input[name="nzbid"]')[0].value;
		var nzburl = url + '?action=getnzb&nzbid=' + nzbid;
	}

	// Add the authentication to the link about to be fetched
	nzburl += '&i=' + user;
	nzburl += '&h=' + hash;
	addToSABnzbd(addLink, nzburl, "addurl");

	return false;
}

function handleAllDownloadLinks() {
	// List view: add a button above the list to send selected NZBs to SAB
	$('input[name="emptycart"]').each(function() {
        //var href = $(this).attr('href');
        //var img = chrome.extension.getURL('/images/sab2_16.png');
        var button = '<input type="button" name="sab" value="Send to SABnzbd" class="submit" />';
        $(this).after(button);
		$(this).parent().find('input[name="sab"]').first().click(addToSABnzbdFromNZBORG);
    });

	// List view: Loop through each download link and prepend a link+img to add to sabnzbd
	$('.dlnzb').each(function() {
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var href = $(this).attr('href');
		var link = '<a class="addSABnzbd" href="' + href + '"><img src="' + img + '" /></a> or ';
		$(this).before(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromNZBORG);
	});
	// Details view: Find the download button, and prepend a sabnzbd button
	$('input[name="downloadnzb"]').each(function() {
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var link = '<input class="addSABnzbd submit" type="button" value="      Download" style="background-image: url('+img+'); background-repeat: no-repeat; background-position: 3px 1px;" />';
		$(this).before(link);
		$(this).parent().find('input[class="addSABnzbd submit"]').first().click(addToSABnzbdFromNZBORG);
	});	
}

chrome.extension.sendRequest({'action' : 'getContext'}, function(response){
	if (response.value.config.enable_nzbsorg == "0") {
		return;
	}
	handleAllDownloadLinks();
});
