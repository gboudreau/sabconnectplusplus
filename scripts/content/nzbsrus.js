var user;
var rssHash;
var nzburl;
var addLink;
var category = null;
var apikey = null;
var nzbName = "";
function findNZBId(elem) {
	var url = $(elem).attr('href');

	url = url.replace('nzbdownload', 'nzbdownload_rss');
	
	if (url.indexOf('https://') == -1) {
		url = 'https://www.nzbsrus.com/' + url;
	}

    var cutAt = url.lastIndexOf('/');
    var lastName = url.lastIndexOf('.')
    nzbName = decodeURIComponent(url.substr(cutAt + 1, lastName - (cutAt + 1)));
	url = url.substr(0, cutAt);

	return url;
}


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

		if (user && rssHash && apikey) {
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
	console.log("fetch api key");
	$.post("https://www.nzbsrus.com/rss.php", { agree: 1, "I Understand": "Submit" },
       function (data) {

           var regEx = /hsh.+'([A-z0-9]{6})'/;
           var matches = regEx.exec(data);
           apikey = matches[1];
           addToSABnzbdFromNZBsRusCont();
       });
	
}

function addToSABnzbdFromNZBsRusCont()
{
	var downloasHash = rssHash;
	var nzbId = nzburl.substr(nzburl.lastIndexOf('/')+1, 10);
	for (var i=0; i<nzbId.length; i++) {
		downloasHash = downloasHash.substr(0, i*4) + nzbId[i] + downloasHash.substr(i*4+1, 32);
	}
    
    var key = "?";
    var fullUrl = "?";

    console.log("nzbId:" + nzbId);
    console.log("userid:" + user);
    console.log("rssHash:" + rssHash);
    console.log("downloasHash:" + downloasHash);
    console.log("APIKey:" + apikey);

    $.getJSON("https://www.nzbsrus.com/api.php", { "uid": user, "key": apikey, "searchtext": nzbName },
               function (res) {
                   console.log("----------");
                   console.log(res);
                   for (var i = 0; i < res.results.length; i++) {
                       var record = res.results[0];
                       if (record.id == nzbId) {
                           key = record.key;
                           break;
                       }
                   }
                   console.log("----------");
                   if (key != "?") {
                       fullUrl = nzburl + '/' + user + '/' + key + '/';
                       console.log(fullUrl);
                       addToSABnzbd(addLink, fullUrl, "addurl", null, category);
                   }
                   else {
                       alert("Could not find result using the api");
                   }
               });
}

function handleAllDownloadLinks() {
	// On details pages:
    $('img[title*="Download NZB"]').each(function () {
        // Change the title to "Send to SABnzbd"
        $(this).attr("title", "Send to SABnzbd");

        // Change the nzb download image
        var img = chrome.extension.getURL('images/sab2_16.png');
        $(this).hide('slow', function () {
            $(this).attr("src", img);
            $(this).show('slow');
            // Change the on click handler to send to sabnzbd
            // this is the <img>, parent is the <a>
            $(this).parent().click(addToSABnzbdFromNZBsRus);
        })
        

        
    });
	
	// On search results (tabulated) pages:
    $.merge($('div[title*="Download NZB"] > a'), $('a[title*="Download NZB"]')).each(function () {
        // Change the title to "Send to SABnzbd"
        $(this).parent().hide('slow', function () {
            $(this).attr("title", "Send to SABnzbd");

            // Change the nzb download image
            var img = chrome.extension.getURL('images/sab2_16.png');
            $(this).parent().css('background-image', 'url(' + img + ')');
            $(this).parent().css('background-size', '25px');
            $(this).parent().css('background-repeat', 'no-repeat');
            $(this).parent().show('slow');
            // Change the on click handler to send to sabnzbd
            // this is the <a>
            $(this).click(addToSABnzbdFromNZBsRus);
        })
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

Initialize( 'nzbsrus', null, function() {
	handleAllDownloadLinks();
});
