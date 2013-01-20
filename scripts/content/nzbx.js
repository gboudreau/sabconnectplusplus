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
	
	var category;
	var $tr = $(this).closest('tr');
	if ($tr.find('td:nth-child(1) a.btn-inverse').length == 1) {
        category = $.trim($tr.find('td:nth-child(1) a.btn-inverse').text().match(/^\s*([^> -]+)/)[1]);
	}
	
	addToSABnzbd(addLink, nzburl, "addurl", nice_name, category);
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