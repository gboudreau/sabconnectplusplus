function getNzbId(elem) {
	var match = /\?id=([0-9a-zA-Z]{5,6})/i.exec(elem);
	
	if (typeof match != 'undefined' && match != null) {
		var nzbId = match[1];
		return nzbId;
	} else {
		return null;
	}
}

function getUserName() {
	var protocol = 'http';
	
	if (window.location.href.indexOf('https') == 0) {
		protocol = 'https';
	}
	
	var apiHtml = $.ajax({url: protocol + "://omgwtfnzbs.me/account.php?action=api", async: false}).responseText;
	var username = apiHtml.match(/<sabuser>(.*)<\/sabuser>/)[1];
	return username;
}

function getApiKey() {
	var protocol = 'http';
	
	if (window.location.href.indexOf('https') == 0) {
		protocol = 'https';
	}
			
	var apiHtml = $.ajax({url: protocol + "://omgwtfnzbs.me/account.php?action=api", async: false}).responseText;
	var apiKey = apiHtml.match(/<sabapikey>(.*)<\/sabapikey>/)[1];
	
	if (apiKey != null) {	
		return apiKey;
	} else {
		return null;
	}
}

function addMany(e) {
		var category = null;
		

		$("#sendToSabButton").prop('value', 'Sending...');
		
		$("input:checkbox").each(function() {
			if ( $(this).attr('name') == "cartcbitems[]" && this.checked) {
				category = $.trim($(this).attr('category').match(/^\s*([^:]+)/)[1]);
				addOne($(this).val(),category);
			}
		});
	
		$("#sendToSabButton").prop('value', 'Sent to SABnzbd');
	
		setTimeout(function() {
			$("#sendToSabButton").prop('value', 'Send to SABnzbd');
		}, 4000);
	
		return false;
	}

function addOne(nzbid,cat) {
	var addLink = this;	
	var url = "https://api.omgwtfnzbs.me/nzb/?";
	
	// Build up the URL to the API for direct downloading by getting the NZB Id, Username and API Key
	url = url + 'id=' + nzbid + '&user=' + getUserName() + '&api=' + getApiKey();
	
	// Get the category		
	var category = cat;
		
	if (category === null) {
		category = "default";
	}
	
	   addToSABnzbd(
    		addLink, 
    		url, 
    		"addurl",
    		null,
    		category);
    
    return false;	
	
}	
	
function addToSABnzbdFromOmgwtfnzbs() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);
    
    var nzburl = $(this).attr('href');	
    var addLink = this;	
	var url = "https://api.omgwtfnzbs.me/nzb/?";
	
	if (nzburl.indexOf('http://') == 0) {
		url = "http://api.omgwtfnzbs.me/nzb/?";
	}
	
	// Build up the URL to the API for direct downloading by getting the NZB Id, Username and API Key
	url = url + 'id=' + getNzbId(nzburl) + '&user=' + getUserName() + '&api=' + getApiKey();
	
	// Get the category		
	var category = null;
	// find the category for the browse.php page
	if ($.trim($(this).parents('.nzbt_row').html())) {
		category = $.trim($(this).parents('.nzbt_row').html());
		category = category.match(/<sabcategory>(.*)<\/sabcategory>/)[1];
	}
	// find the category for the details.php page
	else if ($( "#category" ).length != 0)
	{
		category = $.trim($('#category').html());
		category = category.match(/<sabcategory>(.*)<\/sabcategory>/)[1];
	}
	// find the category for the trends.php page
	else if ($(this).parents('.flag_float:first').children('.small_middle').children('.bmtip.cat_class').html()) {
		category = $.trim($(this).parents('.flag_float:first').html());
		category = category.match(/<sabcategory>(.*)<\/sabcategory>/)[1];
	}
	
	if (category === null) {
		category = "default";
	}
	
	// Send the NZB to SABnzbd
    addToSABnzbd(
    		addLink, 
    		url, 
    		"addurl",
    		null,
    		category);
    
    return false;	
}

function handleAllDownloadLinks() {	
	$('img[src="pics/dload.gif"]').each(function() {		
		var href = $(this).parent().attr('href');
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var link_mini = '<a class="addSABnzbd hastip" href="' + href + '" style="vertical-align: middle;"><img border="0" src="' + img + '" title="Send to SABnzbd" style="position:relative;margin-top:5px;width:16px;" /></a>&nbsp;';
		var link_full = '<a class="addSABnzbd linky hastip" href="' + href + '"><img border="0" src="' + img + '" title="Send to SABnzbd" /> Send to SABnzbd</a>&nbsp;';
				
		if ($(this).parent().hasClass('linky') === false) {			
			$(this).parent().before(link_mini);
		} else {
			$(this).parent().before(link_full);
		}		
	});

	$("#dlButton:submit").each(function() {
		$(this)
		 .after('&nbsp<input type="button" value="Send to SABnzbd" id="sendToSabButton" />')
		 ;
		 $(document).on("click", "#sendToSabButton", function(){
			addMany();
		});
	});
	
	// Change the on click handler to send to sabnzbd
	// moved because the way it was the click was firing multiple times
	$('.addSABnzbd').each(function() {
		$(this).click(addToSABnzbdFromOmgwtfnzbs);
	});	
	
	return;
}

Initialize( 'omgwtfnzbs', null, function() {
	handleAllDownloadLinks();
});

