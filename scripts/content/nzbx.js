var use_nice_name_nzbx;

function addToSABnzbdFromNZBX() {

    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').first().attr("src", img);
    
	var nzburl = $(this).attr('href');
    var addLink = $(this).parent();
    
	if (use_nice_name_nzbx == '1') {
		var split = nzburl.indexOf("*|*");
		if(split != -1) {
			var nice_name = nzburl.substring(split + 3);
		}
	}
	
	addToSABnzbd(addLink, nzburl, "addurl", nice_name);
    return false;
}

function handleAllDownloadLinks() {
	$("a[href^='/nzb?']").each(function() {
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var href = $(this).attr('href');
		var link = $('<a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a>');
		link.click(addToSABnzbdFromNZBX);
		var wrap = $("<span></span>");
		wrap.append(link);
		$(this).after("<br>", wrap);
	});
	return;
}

function RefreshSettings()
{
	GetSetting( 'use_name_nzbx', function( value ) {
		use_nice_name_nzbx = value;
	});
}

Initialize( 'nzbx', RefreshSettings, function() {
	handleAllDownloadLinks();
});