var use_nice_name_nzbindex;

function addToSABnzbdFromNzbindex() {
    var addLink = this;

    // Set the image to an in-progress image
    var img = chrome.runtime.getURL('images/content_icon_fetching.png');
    if ($(this).find('img').length > 0) {
        $(this).find('img').attr("src", img);
        var nzburl = $(this).attr('href');
        var categories = $(this).parent().parent().parent().parent().find('td')[3].innerText;
        if (categories.indexOf('\n') != -1) {
            var category = categories.substr(0, categories.indexOf('\n'));
        } else {
            var category = categories;
        }
        if (use_nice_name_nzbindex == '1') {
            var nice_name = $($(this).parent().parent().parent().parent().find('td')[1]).find('label')[0].innerText;
        }
        addToSABnzbd(addLink, nzburl, "addurl", nice_name, category);
    } else {
        $(this).css('background-image', 'url(' + img + ')');

        //grab all checked boxes on page
        var a = document.getElementsByTagName('input');
        for (var i = 0, len = a.length; i < len; ++i) {
            if (a[i].type == 'checkbox' && a[i].checked) {
                if ($(a[i]).parent().parent().find('td').length < 4) {
                    continue;
                }
                var categories = $(a[i]).parent().parent().find('td')[3].innerText;
                if (categories.indexOf('\n') != -1) {
                    var category = categories.substr(0, categories.indexOf('\n'));
                } else {
                    var category = categories;
                }
                if (use_nice_name_nzbindex == '1') {
                    var nice_name = $($(a[i]).parent().parent().find('td')[1]).find('label')[0].innerText;
                }
                addToSABnzbd(addLink, 'https://nzbindex.com/download/' + a[i].value + '/' + escape(nice_name), "addurl", nice_name, category);
            }
        }
    }

    return false;
}

function handleAllDownloadLinks() {
    $('input[value="Create NZB"]').each(function () {
        if ($(this).attr('x-nzbpatched') !== 'true') {
            $(this).attr('x-nzbpatched', 'true');
            // add button to send checked items to SABConnect
            var img = chrome.runtime.getURL('/images/content_icon.png');
            var link = '<input class="addSABnzbd" x-nzbpatched="true" type="button" value="      Download selected" style="background-image: url(' + img + '); background-repeat: no-repeat; background-position: 3px 1px;" />';
            $(this).after(link);
            $(this).parent().find('input[class="addSABnzbd"]').first().click(addToSABnzbdFromNzbindex);
        }
    });

    $('table a[href*="nzbindex.nl\\/download\\/"]').each(function () {
        if ($(this).attr('x-nzbpatched') !== 'true') {
            $(this).attr('x-nzbpatched', 'true');
            var img = chrome.runtime.getURL('/images/content_icon.png');
            var href = $(this).attr('href');
            var link = $('<a class="addSABnzbdOnClick" x-nzbpatched="true" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a>');
            $(this).before(link);
            $(link).click(addToSABnzbdFromNzbindex);
        }
    });

    $('table a[href*="nzbindex.com\\/download\\/"]').each(function () {
        if ($(this).attr('x-nzbpatched') !== 'true') {
            $(this).attr('x-nzbpatched', 'true');
            var img = chrome.runtime.getURL('/images/content_icon.png');
            var href = $(this).attr('href');
            var link = $('<a class="addSABnzbdOnClick" x-nzbpatched="true" href="' + href + '"><img title="Send to SABnzbd" src="' + img + '" /></a> ');
            $(this).before(link);
            $(link).click(addToSABnzbdFromNzbindex);
        }
    });
}

function RefreshSettings() {
    GetSetting('use_name_nzbindex', function (value) {
        use_nice_name_nzbindex = value;
    });
}

Initialize('nzbindex', RefreshSettings, function () {
    let insertionInProgress = false;

    function DOMNodeInserted() {
        if (!insertionInProgress) {
            insertionInProgress = true;
            handleAllDownloadLinks();
            insertionInProgress = false;
        }
    }
    document.documentElement.addEventListener('DOMNodeInserted', DOMNodeInserted, false);
    DOMNodeInserted();
});