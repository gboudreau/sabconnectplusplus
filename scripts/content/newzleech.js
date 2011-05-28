function addToSABnzbdFromNewzleech() {
    // Set the image to an in-progress image
    var img = chrome.extension.getURL('images/sab2_16_fetching.png');
    $(this).find('img').attr("src", img);
    
    var nzburl = $(this).attr('href');
    var addLink = this;
    
    addToSABnzbd(addLink, nzburl, "addurl");
    
    return false;
}

function addAllToSABnzbdFromNewzleech() {
    $('td.check input:checked').each(function() {
        $(this).parent().parent().find('td.get a.addSABnzbd').click();
        $(this).attr('checked', false);
    });
}

function handleAllDownloadLinks() {
    $('td.get a').each(function() {
        var href = $(this).attr('href');
        var img = chrome.extension.getURL('/images/sab2_16.png');
        var link = '<a class="addSABnzbd" href="http://newzleech.com/' + href + '"><img src="' + img + '" /></a> ';
        $(this).before(link);
        $(this).remove();
    });

    // Change the on click handler to send to sabnzbd
    // moved because the way it was the click was firing multiple times
    $('.addSABnzbd').each(function() {
        $(this).click(addToSABnzbdFromNewzleech);
    });
    
    if($('.addSABnzbd').length > 0)
    {
        var link = '<input type="button" class="addSABnzbdAll" value="Add to Sabnzbd" name="sab" onclick="">';
        $('[type=submit][name=getnzb]').after(link);
        
        $('.addSABnzbdAll').each(function() {
            $(this).click(addAllToSABnzbdFromNewzleech);
        });
    }
    
    return;
}

Initialize( 'newzleech', function() {
    handleAllDownloadLinks();
});