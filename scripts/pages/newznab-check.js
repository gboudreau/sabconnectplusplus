String.prototype.trim = function(){return this.replace(/^\s+|\s+$/g, '');};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        var found_nab = false;
        var newznab_urls_pre = store.get('provider_newznab');
        if (typeof newznab_urls_pre == 'undefined')
            return;
        var newznab_urls = newznab_urls_pre.split(',');
        var parsedurl = $.url.parse( tab.url );
        var host = (parsedurl.host.match(/([^.]+)\.\w{2,3}(?:\.\w{2})?$/) || [])[0]
        for (var i = 0; i < newznab_urls.length; i++) {
            var newznab_url = newznab_urls[i].trim();
            if (newznab_url.length > 0 && tab.url.match('https?://.*' + newznab_url + '.*')) {
                chrome.tabs.executeScript(tabId, {file: "third_party/jquery/jquery-1.7.2.min.js"});
                chrome.tabs.executeScript(tabId, {file: "scripts/content/common.js"});
                chrome.tabs.executeScript(tabId, {file: "third_party/webtoolkit/webtoolkit.base64.js"});
                chrome.tabs.executeScript(tabId, {file: "scripts/content/newznab.js"});
                chrome.tabs.insertCSS(tabId, {file: "css/newznab.css"});
                if ( store.get( 'nabignore.' + host ) === false )
                    store.set( 'nabignore.' + host );
                found_nab = true;
                break;
            }
        }
        if ( (!found_nab) && (tab.url.indexOf('http') == 0) ) {
            var nabenabled = store.get( 'nabignore.' + host );
            var nabdetection = store.get('config_enable_automatic_detection');
            if ( nabdetection && !nabenabled ) {
                chrome.tabs.executeScript(tabId, {file: "third_party/jquery/jquery-1.7.2.min.js"});
                chrome.tabs.executeScript(tabId, {file: "third_party/jquery/jquery.notify.js"});
                chrome.tabs.executeScript(tabId, {file: "scripts/content/common.js"});
                chrome.tabs.executeScript(tabId, {file: "scripts/pages/newznab-autoadd.js"});
                chrome.tabs.insertCSS(tabId, {file: "css/nabnotify.css"});
            }
            if ( nabenabled === false )
                store.set( 'nabignore.' + host );
        }
    }
});
