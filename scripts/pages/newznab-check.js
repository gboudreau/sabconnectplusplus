String.prototype.trim = function(){return this.replace(/^\s+|\s+$/g, '');};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        var found_nab = false;
        var newznab_urls = store.get('provider_newznab').split(',');
        for (var i = 0; i < newznab_urls.length; i++) {
            var newznab_url = newznab_urls[i];
            if (tab.url.match('https?://.*' + newznab_url.trim() + '.*')) {
                chrome.tabs.executeScript(null, {file: "third_party/jquery/jquery-1.7.2.min.js"});
                chrome.tabs.executeScript(null, {file: "scripts/content/common.js"});
                chrome.tabs.executeScript(null, {file: "third_party/webtoolkit/webtoolkit.base64.js"});
                chrome.tabs.executeScript(null, {file: "scripts/content/newznab.js"});
                chrome.tabs.insertCSS(null, {file: "css/newznab.css"});
                found_nab = true;
                break;
            }
        }
        if ( (!found_nab) ) {
            chrome.tabs.executeScript(null, {file: "third_party/jquery/jquery-1.7.2.min.js"});
            chrome.tabs.executeScript(null, {file: "scripts/content/common.js"});
            chrome.tabs.executeScript(null, {file: "scripts/pages/newznab-autoadd.js"});
        }
    }
});
