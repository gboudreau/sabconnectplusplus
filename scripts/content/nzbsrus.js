var user;
var rssHash;

function findNZBId(elem) {
	var url = $(elem).attr('href');

	url = url.replace('nzbdownload', 'nzbdownload_rss');
	
	if (url.indexOf('http://') == -1) {
		url = 'http://www.nzbsrus.com/' + url;
	}

	var cutAt = url.lastIndexOf('/');
	url = url.substr(0, cutAt);

	return url;
}

var nzburl;
var addLink;
var category = null;
function addToSABnzbdFromNZBsRus() {
	// Find the newzbin id from the href
	nzburl = findNZBId(this);
	if (nzburl) {
		// Set the image to an in-progress image
		var img = chrome.extension.getURL('images/sab2_16_fetching.png');
		if ($(this).find('img').length > 0) {
			$(this).find('img').attr("src", img);

			categoryIsNext = false;
			$('td').each(function() {
				if (categoryIsNext == true) {
					category = $(this).find('a').text();
					categoryIsNext = false;
				}
				if ($(this).text() == 'NewsGroup') {
					categoryIsNext = true;
				}
			});
		} else {
			$(this).css('background-image', 'url('+img+')');
			$(this).css('background-size', '25px');
			$(this).css('background-repeat', 'no-repeat');
			category = $(this).parent().parent().parent().find('div[class="newsg"]').find('a')[1].innerText;
		}
		addLink = this;
		
		if( user && rssHash ) {
			addToSABnzbdFromNZBsRusCont();
		} else {
			getHashFromNZBsRus();
		}

		return false;
	}
}

function getHashFromNZBsRus() {
	console.log('getHashFromNZBsRus');
	// Scrape the users userid and hash to add to download links
	if ($('#sabcpp')) {
		console.log('...using #sabcpp');
		try {
			var json = Base64.decode($('#sabcpp').text());
			var jsonObj = JSON.parse(json);
			var user = jsonObj.uid;
			var rssHash = jsonObj.hash;
		} catch(err) { }
	}
	if (typeof rssHash == 'undefined' || rssHash == null || rssHash.length != 32) {
		console.log('...using rss.php');
		var scheme = 'http';
		if (window.location.href.indexOf('https://') == 0) {
			scheme = 'https';
		}
		var rssHTML = $.ajax({url: scheme + "://www.nzbsrus.com/rss.php", async: false}).responseText;
		var match = /genurl.this,([0-9]*),'([0-9a-f]*)'/i.exec(rssHTML);
		var user = match[1];
		var rssHash = match[2];
	}
	
	this.user = user;
	this.rssHash = rssHash;
	addToSABnzbdFromNZBsRusCont();
}

function addToSABnzbdFromNZBsRusCont()
{
	var downloasHash = rssHash;
	var nzbId = nzburl.substr(nzburl.lastIndexOf('/')+1, 10);
	for (var i=0; i<nzbId.length; i++) {
		downloasHash = downloasHash.substr(0, i*4) + nzbId[i] + downloasHash.substr(i*4+1, 32);
	}
	
	// Add the authentication to the link about to be fetched
	nzburl += '/' + user + '/' + downloasHash + '/';

	addToSABnzbd(addLink, nzburl, "addurl", null, category);
}

function handleAllDownloadLinks() {
	// On details pages:
	$('img[title*="Download NZB"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");
		
		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).attr("src", img);

		// Change the on click handler to send to sabnzbd
		// this is the <img>, parent is the <a>
		$(this).parent().click(addToSABnzbdFromNZBsRus);
	});
	
	// On search results (tabulated) pages:
	$('a[title*="Download NZB"]').each(function() {
		// Change the title to "Send to SABnzbd"
		$(this).attr("title", "Send to SABnzbd");

		// Change the nzb download image
		var img = chrome.extension.getURL('images/sab2_16.png');
		$(this).parent().css('background-image', 'url('+img+')');
		$(this).parent().css('background-size', '25px');
		$(this).parent().css('background-repeat', 'no-repeat');

		// Change the on click handler to send to sabnzbd
		// this is the <a>
		$(this).click(addToSABnzbdFromNZBsRus);
	});
	
	// Remove AJAX pager & search
	$('a[onclick*="pager(this)"]').each(function() {
		$(this).attr("onclick", "return true;");
	});
	$('form[action="/nzbbrowse.php"]').each(function() {
		$(this).attr("onsubmit", "return true;");
	});
	$('input[name="ajsearch"]').each(function() {
		$(this).attr("value", "0");
	});	
}

Initialize( 'nzbsrus', function() {
	handleAllDownloadLinks();
});
