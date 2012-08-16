function addToSABnzbdFromMysterbin() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);

    var nzburl = "http://www.mysterbin.com/" + $(this).attr('href');
    var addLink = this;

    addToSABnzbd(addLink, nzburl, "addurl");

    return false;
}

function addAllToSABnzbdFromMysterbin() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);

    var cboxes = document.getElementsByTagName('input');
    var nzburl = "http://www.mysterbin.com/nzb?";

    // build the url for multiple nzbs
    for (var i=0, len=cboxes.length; i<len; ++i) {
        if (cboxes[i].type == 'checkbox' && cboxes[i].checked) {
            nzburl = nzburl + "c=" + cboxes[i].value + "&";
        }
    }

    var addLink = this;
    addToSABnzbd(addLink, nzburl, "addurl");
    return false;
}

function handleAllDownloadLinks() {
    // "NZB" links
    $('a[href^="nzb\\?c\\="]').each(function() {
        var href = $(this).attr('href');
        var img = chrome.extension.getURL('/images/sab2_16.png');
        var link = '<a id="addSABnzbdOnClick" href="' + href + '"><img src="' + img + '" /></a> ';
        $(this).after(link);
        $(this).remove();
    });
    $('a[id="addSABnzbdOnClick"]').each(function() {
        $(this).click(addToSABnzbdFromMysterbin);
    });

    // "Selection => NZB" button
    $('input[value^="Selection =>"]').each(function() {
        var img = chrome.extension.getURL('/images/sab2_16.png');
        var link = '<input id="addAllSABnzbdOnClick" class="b addSABnzbd" type="button" value="    Selection => NZB" style="background-image: url('+img+'); background-repeat: no-repeat; background-position: 3px 3px;" />';
        $(this).after(link);
        $(this).remove();
    });
    $('input[id="addAllSABnzbdOnClick"]').each(function() {
        $(this).click(addAllToSABnzbdFromMysterbin);
    });

    // Download group
    $('img[src="downgroup-red-20px.png"]').each(function() {
        var href = $(this).parent().attr('href');
        var img = chrome.extension.getURL('/images/sab2_16.png');
        var link = '<a id="addGroupSABnzbdOnClick" href="' + href + '"><img src="' + img + '" /> download group</a>';
        $(this).parent().before(link);
        $(this).parent().next().remove();
        $(this).parent().remove();
    });
    $('a[id="addGroupSABnzbdOnClick"]').each(function() {
        $(this).click(addToSABnzbdFromMysterbin);
    });

    return;
}

Initialize( 'mysterbin', null, function() {
    handleAllDownloadLinks();
});
