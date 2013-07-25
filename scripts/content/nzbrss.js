function addToSABnzbdFromNzbrss() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');

    // Only replace the image if it isn't a Bootstrap button style
    if ($(this).hasClass('btn') == false) {    	
    	$(this).find('img').attr("src", img);
	}
    
    var nzburl = $(this).attr('href');	
    var addLink = this;	
	
	// Send the NZB to SABnzbd
    addToSABnzbd(
    		addLink, 
    		nzburl, 
    		"addurl",
    		null,
    		null);
    
    return false;	
}

function handleAllDownloadLinks() {		
	// Process each NZB link on the front page and show page
	$.each($('a[href^="/nzb/"]'), function(index, val) {
		// Prevent it from detecting the NZB link in the Breadcrumbs on the NZB page
		if ($(this).parents('ul').hasClass('breadcrumb') == false) {
			var href = $(this).attr('href').replace("/nzb/", "/get/");
			var img = chrome.extension.getURL('/images/sab2_16.png');
			var link = '<a class="addSABnzbd" href="' + href + '"><img border="0" src="' + img + '" title="Send to SABnzbd" /></a>&nbsp;';
			$(this).before(link);
		}
	});

	// Process the "Download Button" on the NZB page
	var nzburl = $(".downloadBtn").children("a:first").attr("href");	
	var link = '<a class="btn btn-info addSABnzbd" href="' + nzburl + '">Send to SABnzbd</a>';
	$(".downloadBtn").append(link);

	// Change the on click handler to send to sabnzbd
	// moved because the way it was the click was firing multiple times
	$('.addSABnzbd').each(function() {
		$(this).click(addToSABnzbdFromNzbrss);
	});	
	
	return;
}

Initialize( 'nzbrss', null, function() {
	handleAllDownloadLinks();
});