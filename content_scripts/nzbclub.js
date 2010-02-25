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
	$('img[title="Download NZB"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");
		
		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).attr("src", img);

		// Change the on click handler to send to sabnzbd
		$(this).click(addToSABnzbdFromNZBCLUB);		
	});
	return;
}


//$(document).ready(handleAllDownloadLinks);
$(document).bind("DOMNodeInserted", handleAllDownloadLinks);
