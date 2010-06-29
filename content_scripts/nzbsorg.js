// Scrape the users userid and hash to add to download links
var rssURL = $('link[title="RSS 1.0"]').attr('href');
// These will fail if nzbs.org changes the RSS feed at all
var match = /i=([^&]*)/i.exec(rssURL);
var user = match[1];
var match = /h=([^&]*)/i.exec(rssURL);
var hash = match[1];

//http://nzbs.org/index.php?action=getnzb&nzbid=307942
function addToSABnzbdFromNZBORG() {
	var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	$(this).find('img').attr("src", img);
	
	// Find the newzbin id from the href
	var url = 'http://nzbs.org/';
	var nzburl = url.concat($(this).attr('href'));

	// Add the authentication to the link about to be fetched
	nzburl += '&i=' + user;
	nzburl += '&h=' + hash;

	var addLink = this;
	addToSABnzbd(addLink, nzburl, "addurl");

	return false;
}

function handleAllDownloadLinks() {
	// Loop through each download link and prepend a link+img to add to sabnzbd
	$('.dlnzb').each(function() {
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var href = $(this).attr('href');
		var link = '<a class="addSABnzbd" href="' + href + '"><img src="' + img + '" /></a> ';
		$(this).before(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromNZBORG);
	});
}

chrome.extension.sendRequest({'action' : 'getContext'}, function(response){
	if (response.value.config.enable_nzbsorg == "0") {
		return;
	}
	handleAllDownloadLinks();
});
