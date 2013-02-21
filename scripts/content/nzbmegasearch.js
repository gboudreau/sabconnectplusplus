(function() {

function addOne() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').first().attr("src", img);
    
	var nzburl = $(this).attr('href');
	
	addToSABnzbd($(this), nzburl, "addurl");
    return false;
}

function handleAllDownloadLinks() {
	var img = chrome.extension.getURL('/images/sab2_16.png');
	
	$(document).on("click", ".addSABnzbd", addOne);
	
	var $megaRows = $("#results tbody tr");
	if($megaRows.length > 0) {
		$("#results thead tr").prepend($("<th> </th>"));
	
		$megaRows.each(function() {
			var $tr = $(this);
			var href = $(".titlecell a", $tr).attr("href");
			var link = $('<td><a class="addSABnzbd" href="' + href + '" style="display:block;position:relative;top:4px;margin-right:10px;"><img title="Send to SABnzbd" src="' + img + '"></a></td>');
			
			$tr.prepend(link);
		});
	}
}

function RefreshSettings()
{
}

Initialize( 'nzbx', RefreshSettings, function() {
	handleAllDownloadLinks();
});

})();
