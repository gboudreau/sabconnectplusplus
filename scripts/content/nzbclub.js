function addToSABnzbdFromNZBCLUB() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').first().attr("src", img);

    var nzburl = $(this).attr('href');
    var addLink = $(this).parent();

    addToSABnzbd(addLink, nzburl, "addurl");

    return false;
}

function handleAllDownloadLinks() {
	$('div.project-action > div > button[id="get"]').each(function() {
	    var img = chrome.extension.getURL('/images/sab2_16.png');
	    var href = "https://www.nzbclub.com/nzb_get/" + $(this).parent().parent().attr('collectionid');
	    var link = '<a class="btn btn-xs btn-warning addSABnzbd" href="' + href + '"><img style="margin-top: auto; width: 14px; height: 14px; border-radius: 0%; margin-bottom: auto;" title="Send to SABnzbd" src="' + img + '" /> To SAB</a>';
	    $(this).after(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromNZBCLUB);
	});
	return;
}

Initialize( 'nzbclub', null, function() {
	handleAllDownloadLinks();
});