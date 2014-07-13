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
	$('span[id^="ctl00_ContentPlaceHolder2_RadGrid1_ctl00_ctl"][id$="_ui_sizelabel"]').each(function() {
	    var img = chrome.extension.getURL('/images/sab2_16.png');
	    var href = $(this).find('a').attr('href');
	    var link = '<span><a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /> To SAB</a><br/></span>';
	    $(this).after(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromNZBCLUB);
	});
	return;
}

Initialize( 'nzbclub', null, function() {
	handleAllDownloadLinks();
});