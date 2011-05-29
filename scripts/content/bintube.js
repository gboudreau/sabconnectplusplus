function addToSABnzbdFromBintube() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);
    
    var nzburl = $(this).attr('href');
    var addLink = this;
    	
    addToSABnzbd(addLink, nzburl, "addurl");
    
    return false;
}

function handleAllDownloadLinks() {
	$('a.dlbtn').each(function() {
		var href = $(this).attr('href');
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var link = '<a class="addSABnzbd" href="' + href + '"><img src="' + img + '" /></a> ';
		$(this).before(link);
		$(this).remove();
	});

	// Change the on click handler to send to sabnzbd
	// moved because the way it was the click was firing multiple times
	$('.addSABnzbd').each(function() {
		$(this).click(addToSABnzbdFromBintube);
	});	
	
	return;
}

Initialize( 'bintube', function() {
	handleAllDownloadLinks();
});