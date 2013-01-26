(function () { // Encapsulate

    /*
        New indexes are frequently requested in sabconnectplusplus
        of which the majority are supported as they are Newznab.
        Lets add support to automatically notify the user their
        popular indexer is supported, as well as add it to the
        config automatically if requested.

        ToDo:
        ^ Wrapper to match if we are a Newznab page
        * Popup if we do find a match
        * Add matches if requested by user (support page refresh when complete)
        * Ignore if we are already added (support this in newznab-check.js instead)
        * Provide option to ignore (not popup) if the user says so
        * Honour the user ignore
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
            $('body').prepend(
                $('<div>').addClass('notification autonabSticky hide').prepend(
                    $('<p>Sabconnect++ can setup to work with this site. What would you like to do:</p>').append(
                        ' <a href="javascript:" id="autonabEnable">Enable</a> | <a href="javascript:" id="autonabIgnore">Ignore</a>'
                    ),
                    $('<a class="close" href="javascript:"><div class="autonabStickyClose"></div></a>')
                )
            );
            $('.notification.autonabSticky').notify();
            $('#autonabIgnore').click(function(){});
            $('#autonabEnable').click(function(){});
        });
    }
})();
