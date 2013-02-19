(function() {
var use_nice_name;

function addSelected() {
	var selected = $(".addSABnzbd + input:checked");
	selected.each(function() {
		$.proxy(addOne, $(this).siblings(".addSABnzbd").first())();
		$(this).attr("checked", false);
	});
}

function addOne() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').first().attr("src", img);
    
	var nzburl = $(this).attr('href');
    
	if (use_nice_name == '1') {
		var split = nzburl.indexOf("*|*");
		if(split != -1) {
			var nice_name = nzburl.substring(split + 3);
		}
	}
	
	var category;
	var $tr = $(this).closest('tr');
	if ($tr.find('td:nth-child(1) a.btn-inverse').length == 1) {
		var match = $tr.find('td:nth-child(1) a.btn-inverse').text().match(/^\s*([^> -]+)/);
		if(match != null && match.length > 1)
			category = $.trim(match[1]);
	}
	
	addToSABnzbd($(this), nzburl, "addurl", nice_name, category);
    return false;
}

function handleAllDownloadLinks() {
	var img = chrome.extension.getURL('/images/sab2_16.png');
	
	$(document).on("click", ".addSABnzbd", addOne);
	
	$("a[href^='/nzb?']").each(function() {
		var target = $(this).parent().next("td");
		
		var href = $(this).attr('href');
		var link = $('<a class="addSABnzbd" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '"></a>');
		link.css("margin-right", 6);
		target
			.prepend(link)
			.css("white-space", "nowrap")
		;
		$("input", target).css("margin", 0);
	});
	
	var multi = $("<a class='btn addSABnzbdMultiple'><img title='Send to SABnzbd' src='" + img + "' style='margin:-3px 5px 0 0;'> Download Selected</a>");
	multi
		.css("margin-right", 10)
		.click(addSelected);
	$("#multi-download")
		.before(multi)
		.parents("div").first().css("width", "auto");
}

function RefreshSettings()
{
	GetSetting( 'use_name_nzbx', function( value ) {
		use_nice_name = value;
	});
}

Initialize( 'nzbx', RefreshSettings, function() {
	handleAllDownloadLinks();
});

})();
