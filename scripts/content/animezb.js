function addToSABnzbdFromAnimezb() {
	var addLink = this;
	
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	var nzburl = this.href;

	var category = null;
	try {
		category = $(this).parent().parent().find('span[class*="label"]')[0].innerHTML.toLowerCase();
	} catch (ex) { }
	addToSABnzbd(addLink, nzburl, "addurl", null, category);
	
	return false;
}

function addMultiToSABnzbdFromAnimezb() {
	//if ($('form input[type=checkbox][checked]').size() == 0)
	if ($('table[id="search-results"] tr[class*="highlighted"][class*="results-top-tr"]').size() == 0)
	{
		alert('Please select at least one file');
		return false;
	} else {
		$('table[id="search-results"] tr[class*="highlighted"][class*="results-top-tr"]').each(function() {
			$(this).find('a[class="addSABnzbd"]').first().click();
			$(this).click();
		});
	}
}

function handleAllDownloadLinks() {
	$('table[id="search-results"] td:nth-child(2) a').each(function() {
	    var img = chrome.extension.getURL('/images/sab2_16.png');
	    var href = $(this).attr('href');
	    var link = '<a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a>&nbsp;&nbsp;';
	    $(this).before(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromAnimezb);
	});
}

function addDownloadAllButton() {
	$('form button').each(function() {
	    var img = chrome.extension.getURL('/images/sab2_16.png');
	    var href = $(this).attr('href');
	    var link = '<input type="button" id="addMultiSABnzbd" value="Send to SABnzbd" class="btn btn-sm btn-primary" style="width:120px">';
	    $(this).after(link);
		$(this).parent().find('input[id="addMultiSABnzbd"]').first().click(addMultiToSABnzbdFromAnimezb);
	});
}

Initialize( 'animezb', null, function() {
	handleAllDownloadLinks();
	addDownloadAllButton();
});
