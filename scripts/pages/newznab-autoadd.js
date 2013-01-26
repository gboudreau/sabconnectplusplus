(function () { // Encapsulate

    /*
        New indexes are frequently requested in sabconnectplusplus
        of which the majority are supported as they are Newznab.
        Lets add support to automatically notify the user their
        popular indexer is supported, as well as add it to the
        config automatically if requested.
    */

    // Lets restrict our movements to pages that are newznab, logged in and displaying triggerable data
    if ( ($('[name=RSSTOKEN]').filter(':first').length) &&
            ($('input.nzb_multi_operations_cart').filter(':first').length) )
    {
        var thishost = (window.location.hostname.match(/([^.]+)\.\w{2,3}(?:\.\w{2})?$/) || [])[0];
        var request = {
                action: 'get_setting',
                setting: 'nabignore.' + thishost
        };
        chrome.extension.sendMessage( request, function( response ) {
            if ( response.value == true )
                return;
            $('body').prepend(
                $('<div>').addClass('notification autonabSticky hide').prepend(
                    $('<p>Sabconnect++ can setup to work with this site. What would you like to do:</p>').append(
                        ' <a href="javascript:" id="autonabEnable">Enable</a> | <a href="javascript:" id="autonabIgnore">Ignore</a>'
                    ),
                    $('<a class="close" href="javascript:"><div class="autonabStickyClose"></div></a>')
                )
            );
            $('.notification.autonabSticky').notify();
            $('#autonabIgnore').click(function(){
                var request = {
                    action: 'set_setting',
                    setting: 'nabignore.' + thishost,
                    value: true
                };
                chrome.extension.sendMessage( request );
                $('a.close').click();
            });
            $('#autonabEnable').click(function(){
                var request = {
                    action: 'get_setting',
                    setting: 'provider_newznab'
                };
                chrome.extension.sendMessage( request, function( response ) {
                    var request = {
                        action: 'set_setting',
                        setting: 'provider_newznab',
                        value: response.value + ', ' + thishost
                    };
                    chrome.extension.sendMessage( request, function() {
                        location.reload();
                    });
                });
            });
        });
    }
})();
