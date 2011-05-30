function addToSABnzbdFromFanzub() {
	var addLink = this;
	
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	
	var nzbid = this.href;
	nzbid = nzbid.substring(nzbid.indexOf('(')+1, nzbid.indexOf(')'));
	var nzburl = 'http://www.fanzub.com/nzb/' + nzbid;
	
	var category = null;
	try {
		category = $(this).parent().parent().find('img[src*="/images/cat/"]')[0].alt.toLowerCase();
	} catch (ex) { }
	addToSABnzbd(addLink, nzburl, "addurl", null, category);
	
	return false;
}

function handleAllDownloadLinks() {
	$('table a[href*="javascript:Details"]').each(function() {
	    var img = chrome.extension.getURL('/images/sab2_16.png');
	    var href = $(this).attr('href');
	    var link = '<a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a> ';
	    $(this).before(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromFanzub);
	});
}

Initialize( 'fanzub', null, function() {
	handleAllDownloadLinks();
});