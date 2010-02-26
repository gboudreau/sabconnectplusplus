function addToSABnzbdFromTVNZB() {

    if(!gConfig.enable_tvnzb) {
        // If disabled, skip api and just dl
        return true;
    }
    
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);
    
    // Find the newzbin id from the href
    var nzburl = $(this).attr('href');
    var addLink = this;
    
    addToSABnzbd(addLink, nzburl, "addurl");
    
    return false;

}

$('table a[href*="tvnzb.com\\/nzb\\/"]').each(function() {
    // Change the title to "Send to SABnzbd"
    var img = chrome.extension.getURL('/images/sab2_16.png');
    var href = $(this).attr('href');
    var link = '<a class="addSABnzbd" href="' + href + '"><img src="' + img + '" /></a> ';
    $(this).before(link);

    // Change the on click handler to send to sabnzbd
    $('.addSABnzbd').click(addToSABnzbdFromTVNZB);
    
});

