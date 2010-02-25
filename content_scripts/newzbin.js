function findNZBId(elem) {
    var url = $(elem).attr('href');
    
    var splitstr = url.split(/browse\/post\/(\d+)\/nzb/g);
    return splitstr[1];
    
}

function addToSABnzbdFromIconClick() {

    // Find the newzbin id from the href
    var nzbid = findNZBId(this);
    if(nzbid) {
        // Set the image to an in-progress image
        var img = chrome.extension.getURL('images/sab2_16_fetching.png');
        $(this).find('img').attr("src", img);
        
        var addLink = this;
        
        addToSABnzbd(addLink, nzbid, "addid");
    }

    
    return false;

}

function addToSABnzbdFromCheckbox(checkbox) {

    var link = $(checkbox).closest('tr').find('a[title="Send to SABnzbd"]');
    // Find the nzb id from the links href
    var nzbid = findNZBId(link);
    if (nzbid) {
        var img = chrome.extension.getURL('images/sab2_16_fetching.png');
        // Set the image to an in-progress image
        $(link).find('img').attr("src", img);
        // Uncheck the download
        $(checkbox).attr('checked', '');
        // Remove the styling that gets applied when a checkbox is checked
        // For some reason they apply it to a multiple tbody elements
        $(checkbox).closest('tbody').removeClass('select');
        
        addToSABnzbd(link, nzbid, "addid");
    }

}

// Add a common CSS for styling purposes
var commonCss = chrome.extension.getURL('css/common.css');
$('head').append('<link rel="stylesheet" href="' + commonCss + '" type="text/css" />');

// Add the SABnzbd download icon
$('a[title="Download report NZB"]').each(function() {
    // Change the title to "Send to SABnzbd"
    $(this).attr("title", "");
    
    // Change the nzb download image to our own custom one
    var img = chrome.extension.getURL('images/sab2_16.png');
    $(this).find('img')
    .attr("src", img)
    .attr("width", '16')
    .attr("height",'16');

    // Change the on click handler to send to sabnzbd
    $(this).click(addToSABnzbdFromIconClick);
    
});

$('#topActionsForm table tr td:first').append('<button id="sendMultiple">Send to SABnzbd</button>');
$('#sendMultiple').click(function() {
    $('table.dataTabular input:checkbox:checked').each(function() {
        addToSABnzbdFromCheckbox(this);
    });
    return false;
});

