function addToSABnzbdFromFanzub() {
	var addLink = this;
	
    // Set the image to an in-progress image
    var img = chrome.runtime.getURL('images/sab2_16_fetching.png');
	var nzburl = this.href;

	var category = null;
	try {
		category = $(this).parent().parent().find('img[src*="/images/cat/"]')[0].alt.toLowerCase();
	} catch (ex) { }
	addToSABnzbd(addLink, nzburl, "addurl", null, category);
	
	return false;
}

function addMultiToSABnzbdFromFanzub() {
	if ($('table.fanzub input[type=checkbox][checked]').size() == 0)
	{
		alert('Please select at least one file');
		return false;
	} else {
		$('table.fanzub input[type=checkbox][checked]').each(function() {
			$(this).parent().parent().find('a[class="addSABnzbd"]').first().click();
			$(this).parent().parent().click();
		});
	}
}

function handleAllDownloadLinks() {
	$('table[class="fanzub"] td[class="file"] a').each(function() {
	    var img = chrome.runtime.getURL('/images/sab2_16.png');
	    var href = $(this).attr('href');
	    var link = '<a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a>&nbsp;&nbsp;';
	    $(this).before(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromFanzub);
	});
}

function addDownloadAllButton() {
	$('table[class="nav"] td button').each(function() {
	    var img = chrome.runtime.getURL('/images/sab2_16.png');
	    var href = $(this).attr('href');
	    var link = '<input type="button" id="addMultiSABnzbd" value="Send to SABnzbd" style="width:120px">';
	    $(this).after(link);
		$(this).parent().find('input[id="addMultiSABnzbd"]').first().click(addMultiToSABnzbdFromFanzub);
	});
}

Initialize( 'fanzub', null, function() {
	handleAllDownloadLinks();
	addDownloadAllButton();
});