function addToSABnzbdFromNZBCLUB() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).attr("src", img);
    
    var nzburl = 'http://nzbclub.com' + $(this).parent().attr('href');
    var addLink = $(this).parent();
    	
    addToSABnzbd(addLink, nzburl, "addurl");
    
    return false;
}

function handleAllDownloadLinks() {
	var unbind = false;
	$('img[title="Download NZB"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");
		
		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).attr("src", img);

		// Change the on click handler to send to sabnzbd
		$(this).click(addToSABnzbdFromNZBCLUB);		
		unbind = true;
	});
	if ( unbind )
		$("#ctl00_ContentPlaceHolder1_ui_searchformMain_ui_updatepanelMain").unbind("DOMNodeInserted", handleAllDownloadLinks);
	return;
}

chrome.extension.sendRequest({'action' : 'getContext'},function(response){
	if (response.value.config.enable_nzbclub == "0") {
		return;
	}
	$("#ctl00_ContentPlaceHolder1_ui_searchformMain_ui_updatepanelMain").bind("DOMNodeInserted", handleAllDownloadLinks);
});
