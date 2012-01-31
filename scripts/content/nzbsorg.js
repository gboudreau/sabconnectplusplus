// Scrape the users userid and hash to add to download links
var rssURL = $('link[title="RSS 1.0"]').attr('href');
// These will fail if nzbs.org changes the RSS feed at all
var match = /i=([^&]*)/i.exec(rssURL);
var user = match[1];
var match = /h=([^&]*)/i.exec(rssURL);
var hash = match[1];
var sendToSabButton;

//http://nzbs.org/index.php?action=getnzb&nzbid=307942
function addToSABnzbdFromNZBORG() {
	var addLink = this;
    var url = 'http://nzbs.org/';
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
	var category = null;
	if ($(this).find('img').length > 0) {
		$(this).find('img').attr("src", img);
		var isSearch = false;
		$('h3').each(function() {
			if ($(this).html().indexOf('Search NZBs') != -1 || $(this).html().indexOf('Browse All NZBs') != -1) {
				isSearch = true;
			} else {
				var re = new RegExp('>([^<]+)</a> &gt;.+>([^<]+)</a> &gt;[ ]*(.+)');
				var m = re.exec($(this).html());
				if (m != null) {
					for (var i=1; i<m.length; i++) {
						if (m[i] == 'Home') { continue; }
						if (category != null) {
							category += '.' + m[i];
						} else {
							category = m[i];
						}
					}
				}
			}
		});
		if (isSearch) {
			$(this).parent().parent().parent().find('td').each(function() {
				if ($(this).html().indexOf('index.php?action=browse&amp;catid=') != -1) {
					var re = new RegExp('<a.+>[ ]*(.+)[ ]*</a>');
					var m = re.exec($(this).html());
					if (m != null) {
						category = m[1].replace('-', '.').replace('WMV.HD', 'WMV-HD');
					}
				}
			});
		}

		// Find the nzbs.org download URL
		var nzburl = url.concat($(this).attr('href'));
	} else if (this.nodeName.toUpperCase() == 'INPUT' && this.value == 'Send to SABnzbd') {
		this.value = "Sending...";
		$(this).css('color', 'green');

		var isSearch = false;
        $('h3').each(function() {
            if ($(this).html().indexOf('Search NZBs') != -1 || $(this).html().indexOf('Browse All NZBs') != -1) {
                isSearch = true;
            } else {
                var re = new RegExp('>([^<]+)</a> &gt;.+>([^<]+)</a> &gt;[ ]*(.+)');
                var m = re.exec($(this).html());
                if (m != null) {
                    for (var i=1; i<m.length; i++) {
                        if (m[i] == 'Home') { continue; }
                        if (category != null) {
                            category += '.' + m[i];
                        } else {
                            category = m[i];
                        }
                    }
                }
            }
        });
	    $('tr.selected input:checked').each(function() {
			if (isSearch) {
				$(this).parent().parent().find('td').each(function() {
					if ($(this).html().indexOf('index.php?action=browse&amp;catid=') != -1) {
						var re = new RegExp('<a.+>[ ]*(.+)[ ]*</a>');
						var m = re.exec($(this).html());
						if (m != null) {
							category = m[1].replace('-', '.').replace('WMV.HD', 'WMV-HD');
						}
					}
				});
			}

			var nzbid = this.value;
			var nzburl = url + '?action=getnzb&nzbid=' + nzbid;
			nzburl += '&i=' + user;
			nzburl += '&h=' + hash;
			addToSABnzbd(addLink, nzburl, "addurl", null, category);
		});
		
		this.value = 'Sent to SABnzbd!';
		$(this).css('color', 'red');
		sendToSabButton = this;
		
		setTimeout(function(){ sendToSabButton.value = 'Send to SABnzbd'; $(sendToSabButton).css('color', 'black'); }, 4000);

		return false;
	} else {
		$('h3').each(function() {
			var re = new RegExp('>([^<]+)</a> &gt;.+>([^<]+)</a> &gt;.+>([^<]+)</a>');
			var m = re.exec($(this).html());
			if (m != null) {
				for (var i=1; i<m.length; i++) {
					if (m[i] == 'Home') { continue; }
					if (category != null) {
						category += '.' + m[i];
					} else {
						category = m[i];
					}
				}
			}
		});
		$(this).css('background-image', 'url('+img+')');

		// Find the nzbs.org download URL
		var nzbid = $(this).parent().find('input[name="nzbid"]')[0].value;
		var nzburl = url + '?action=getnzb&nzbid=' + nzbid;
	}

	// Add the authentication to the link about to be fetched
	nzburl += '&i=' + user;
	nzburl += '&h=' + hash;
	addToSABnzbd(addLink, nzburl, "addurl", null, category);

	return false;
}

function handleAllDownloadLinks() {
	// List view: add a button above the list to send selected NZBs to SAB
	$('input[name="emptycart"]').each(function() {
        //var href = $(this).attr('href');
        //var img = chrome.extension.getURL('/images/sab2_16.png');
        var button = '<input type="button" name="sab" value="Send to SABnzbd" class="submit" />';
        $(this).after(button);
		$(this).parent().find('input[name="sab"]').first().click(addToSABnzbdFromNZBORG);
    });

	// List view: Loop through each download link and prepend a link+img to add to sabnzbd
	$('.dlnzb').each(function() {
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var href = $(this).attr('href');
		var link = '<a class="addSABnzbd" href="' + href + '"><img src="' + img + '" /></a> or ';
		$(this).before(link);
		$(this).parent().find('a[class="addSABnzbd"]').first().click(addToSABnzbdFromNZBORG);
	});
	// Details view: Find the download button, and prepend a sabnzbd button
	$('input[name="downloadnzb"]').each(function() {
		var img = chrome.extension.getURL('/images/sab2_16.png');
		var link = '<input class="addSABnzbd submit" type="button" value="      Download" style="background-image: url('+img+'); background-repeat: no-repeat; background-position: 3px 1px;" />';
		$(this).before(link);
		$(this).parent().find('input[class="addSABnzbd submit"]').first().click(addToSABnzbdFromNZBORG);
	});	
}

Initialize( 'nzbs', null, function() {
	handleAllDownloadLinks();
});