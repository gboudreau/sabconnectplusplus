var useNiceName;

function addAllToSABnzbdFromYubse() {
	 // Set the image to an in-progress image
    var img = chrome.runtime.getURL('images/content_icon_fetching.png');
	if ($(this).find('img').length > 0) {
	    $(this).find('img').attr("src", img);
	} else {
		$(this).css('background-image', 'url('+img+')');
	}
	var addLink = this;

    //grab all checked boxes on page
	$("#tableResult input:checked").each(function(){
		var nice_name = "";
		if( useNiceName ) {
			nice_name_element_parent = $(this).parents()[5];
			nice_name = $(nice_name_element_parent).find('#file_detail').text();
			var regnN = new RegExp('"[^""\r\n]*"');
			var nN = regnN.exec(nice_name);
			if (nN !=null)
			{
			 nice_name = "Yubse_" +  nN[0].replace("\"","").replace("\"","");
			}
		}
		addToSABnzbd(addLink, 'http://www.yubse.com/serv/YubseSearch.svc/Download/' + this.name, "addurl",nice_name, null);
	});
	return false;
}

function addToSABnzbdFromYubse(node) {
	 // Set the image to an in-progress image
    var img = chrome.runtime.getURL('images/content_icon_fetching.png');
	if ($(node).find('a[class="addSABnzbd"]').find('img').length > 0) {
	    $(node).find('a[class="addSABnzbd"]').find('img').attr("src", img);
	} else {
		$(node).find('a[class="addSABnzbd"]').css('background-image', 'url('+img+')');
	}
	var addLink = this;
    
	var nice_name = "";
	if( useNiceName ) {
		nice_name = $(node).find('#file_detail').text();
		var regnN = new RegExp('"[^""\r\n]*"');
		var nN = regnN.exec(nice_name);
		if (nN !=null)
		{
		 nice_name = "Yubse_" +  nN[0].replace("\"","").replace("\"","");
		}		
	}
	addToSABnzbd(addLink, 'http://www.yubse.com/serv/YubseSearch.svc/Download/' +$(node).find('input').first().attr('name'), "addurl",nice_name, null);
	return false;
}

function handleAllDownloadLinks() {
	$('.header_btn a:last-child').after(function() {
		var img = chrome.runtime.getURL('/images/content_icon.png');
	    var href = $(this).attr('href');
	    var link = '<a class="addSABnzbd"><img title="Send to SABnzbd" style="margin-top:-20px;" align="absmiddle"  src="' + img + '"/></a> ';
	    $(this).after(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addAllToSABnzbdFromYubse);
	});
	
}

function handleSingleDownloadLink(node) {
	if ($(node).find('a[class="addSABnzbd"]').length==0){
		$(node).find('input').each(function() {
			var img = chrome.runtime.getURL('/images/content_icon.png');
			var href = $(this).attr('href');
			var link = '<td class="addSABnzbd"><a class="addSABnzbd"><img style="margin-top:3px" title="Send to SABnzbd" align="absmiddle"  src="' + img + '"/></a></td> ';
			$(this).parent().parent().find('td:last').after(link);
			$(this).parent().parent().find('a[class="addSABnzbd"]').first().click(function(){ addToSABnzbdFromYubse($(node))});
		});
	}
}

function RefreshSettings()
{
	GetSetting( 'use_name_yubse', function( state ) {
		useNiceName = state;
	});
}

$(document).ready(function() {
	Initialize( 'yubse', RefreshSettings(),  function() {
		handleAllDownloadLinks();
		$("#tableResult tr").each(function(){
			handleSingleDownloadLink(this);
		});
	});
	
	$("#tableResult").bind('DOMNodeInserted', function(event) {
		if (event.target.nodeName=='THEAD')//detect the THEAD construction in the table for create button one time
		{
			handleAllDownloadLinks();
		}
		else if (event.target.nodeName=='TR')//detect all the tr in the table and create button for each
		{
			handleSingleDownloadLink(event.target);
		}
	});
});

 


