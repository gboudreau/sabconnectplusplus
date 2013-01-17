(function($) {
var useNiceName;

function addToSABnzbdFromBinsearch() {
    //grab all checked boxes on page
	$(".xMenuT input:checked[type=checkbox]").each(function() {
		addOne($(this).siblings("a.addSABnzbd"));
	});
	
	return false;
}

function oneClick() {
	addOne(this);
	return false;
}

function addOne(addLink) {
	var $addLink = $(addLink);
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	if ($addLink.find('img').length > 0) {
	    $addLink.find('img').attr("src", img);
	} else {
		$addLink.css('background-image', 'url('+img+')');
	}

	var tr = $addLink.parents("tr").first();
	$tds = $(tr).children("td");
	var categories = $tds[4].innerText;
	if (categories.indexOf('\n') != -1) {
		var category = categories.substr(0, categories.indexOf('\n'));
	} else {
		var category = categories;
	}
	if( useNiceName ) {
		var nice_name = document.getElementsByName("q")[0].value;
		if (!nice_name.length) {			
			nice_name = $tds[2].getElementsByTagName('span')[0].innerText;
		}
	}
	addToSABnzbd($addLink, '/?action=nzb&' + $("input", $tds[1]).attr("name") + '=1', "addurl", nice_name, category);
}

function handleAllDownloadLinks() {
	var img = chrome.extension.getURL('/images/sab2_16.png');

	$(".xMenuT input[type=checkbox]").each(function() {
		var href = '/?action=nzb&' + $(this).attr("name") + '=1';
		var link = $('<a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a>');
		$(this).before(link);
		link.click(oneClick);
	});
	
	$('input[name$="watchlist"]').each(function() {
		// add button to h3 to move checked in to SABConnect
		var link = $('<input class="b addSABnzbd" type="button" value="Download selected" />');
		link.css({
			"background-image": "url("+img+")",
			"background-repeat": "no-repeat",
			"background-position": "3px 1px",
			"padding-left": 25,
			"cursor": "pointer"
		});
		$(this).after(link);
		$(this).siblings('input[class="b addSABnzbd"]').click(addToSABnzbdFromBinsearch);
	});
}

function RefreshSettings()
{
	GetSetting( 'use_name_binsearch', function( state ) {
		useNiceName = state;
	});
}

Initialize( 'binsearch', RefreshSettings, function() {
	handleAllDownloadLinks();
});
})(jQuery);