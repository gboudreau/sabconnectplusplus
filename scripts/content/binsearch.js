var use_nice_name_binsearch;

function addToSABnzbdFromBinsearch()
{
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	if ($(this).find('img').length > 0) {
	    $(this).find('img').attr("src", img);
	} else {
		$(this).css('background-image', 'url('+img+')');
	}
	var addLink = this;

    //grab all checked boxes on page
	var a = document.getElementsByTagName('input');
	for (var i=0, len=a.length; i<len; ++i) {
		if (a[i].type == 'checkbox' && a[i].checked) {
			var categories = $(a[i]).parent().parent().find('td')[4].innerText;
			if (categories.indexOf('\n') != -1) {
				var category = categories.substr(0, categories.indexOf('\n'));
			} else {
				var category = categories;
			}
			if (use_nice_name_binsearch == '1') {
				var nice_name = $(a[i]).parent().parent().find('td')[2].getElementsByTagName('span')[0].innerText;
			}
			addToSABnzbd(addLink, 'http://binsearch.info/?action=nzb&' + a[i].name + '=1', "addurl", nice_name, category);
		}
	}
	return false;
}

function handleAllDownloadLinks()
{
	$('input[name$="watchlist"]').each(function() {
		// add button to h3 to move checked in to SABConnect
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var link = '<input class="b addSABnzbd" type="button" value="    Download selected" style="background-image: url('+img+'); background-repeat: no-repeat; background-position: 3px 3px;" />';
		$(this).after(link);
		$(this).parent().find('input[class="b addSABnzbd"]').first().click(addToSABnzbdFromBinsearch);
	});
}

Initialize( 'binsearch', function() {
	GetControlState( 'use_name_binsearch', function( state ) {
		useNiceName = state;
	});
	
	handleAllDownloadLinks();
});