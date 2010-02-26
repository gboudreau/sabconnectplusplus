function setPref(key, value) {
  var config = {};
  if (localStorage.config) {
    config = JSON.parse(localStorage.config);
  }
  config[key] = value;
  localStorage.config = JSON.stringify(config);
}

function getPref(key) {
  if (!localStorage.config) {
    return undefined;
  }
  var config = JSON.parse(localStorage.config);
  return config[key];
}

var gConfig = new Object();
// Load the config objects into memory since we cannot access them directly in content scripts yet
sendMessage('sab_url');
sendMessage('api_key');
sendMessage('sab_user');
sendMessage('sab_pass');
sendMessage('http_user');
sendMessage('http_pass');

sendMessage('enable_newzbin');
sendMessage('enable_tvnzb');
sendMessage('enable_nzbmatrix');
sendMessage('enable_nzbclub');

function checkEndSlash(input) {
    if (input.charAt(input.length-1) == '/') {
        return input;
    } else {
        var output = input+'/';
        return output;
    }
}

function constructApiUrl() {

    if (gConfig.sab_url) {
        var sabUrl = checkEndSlash(gConfig.sab_url) + 'api';
    } else {
        var sabUrl = checkEndSlash(getPref('sab_url')) + 'api';
    }
    
    return sabUrl;
}

// hasJsConfig = has local html javascript
function constructApiPost(hasJsConfig) {

    if (hasJsConfig) {
        var apikey = getPref('api_key');
    } else {
        var apikey = gConfig.api_key;
    }

    var data = {};
    
    if (apikey) {
        data.apikey = apikey;
    }
    
    return data;
}

function addToSABnzbd(addLink, nzburl, mode) {
	chrome.extension.sendRequest(
		{'action' : 'addToSABnzbd',
		'nzburl' : nzburl,
		'mode' : mode
		});
}


function moveQueueItem(nzoid, pos) {

    var sabApiUrl = constructApiUrl();
    var data = constructApiPost(true);
    data.mode = 'switch';
    data.value = nzoid;
    data.value2 = pos;
    

    $.ajax({
        type: "POST",
        url: sabApiUrl,
        data: data,
		username: getPref('http_user'),
		password: getPref('http_pass'),
        success: function(data) {
            // Since data has changed, refresh the jobs. Does not update the graph because the first param is true
            fetchInfo(true);
        },
        error: function() {
            $('#error').html('Failed to move item, please check your connection to SABnzbd');
        }
    });
 
    
}

function queueItemAction(action, nzoid, callBack) {

    var sabApiUrl = constructApiUrl();
    var data = constructApiPost(true);
    data.mode = 'queue';
    data.name = action;
    data.value = nzoid;    

    $.ajax({
        type: "POST",
        url: sabApiUrl,
        data: data,
		username: getPref('http_user'),
		password: getPref('http_pass'),
        success: function(data) {
            // Since data has changed, refresh the jobs. Does not update the graph because the first param is true
            fetchInfo(true, callBack);
        },
        error: function() {
            $('#error').html('Failed to move item, please check your connection to SABnzbd');
        }
    });
 
    
}



function sendMessage(key) {
    // Create a short-lived named channel to the extension and send a single
    // message through it.
    var port = chrome.extension.connect({name: "notifyChannel"});
    port.postMessage({get: key});
}

// Also listen for new channels from the extension for when the button is
// pressed.
chrome.extension.onConnect.addListener(function(port, name) {
  port.onMessage.addListener(function(msg) {
    if (msg.value) {
        gConfig[msg.key] = msg.value;
    }
  });
});



//file size formatter - takes an input in bytes
function fileSizes(value, decimals){
    // Set the default decimals to 2
    if(decimals == undefined) decimals = 2;
    kb = value / 1024
    mb = value / 1048576
    gb = value / 1073741824
    if (gb >= 1){
        return gb.toFixed(decimals)+"GB"
    } else if (mb >= 1) {
        return mb.toFixed(decimals)+"MB"
    } else {
        return kb.toFixed(decimals)+"KB"
    }
}

/**
 * quickUpdate
 *     If set to true, will not update the graph ect, currently used when a queue item has been moved/deleted in order to refresh the queue list
 */
function fetchInfo(quickUpdate, callBack) {

    var sabApiUrl = constructApiUrl();
    var data = constructApiPost(true);
    
    data.mode = 'queue';
    data.output = 'json';
    data.limit = '5';
    $.ajax({
        type: "GET",
        url: sabApiUrl,
        data: data,
		username: getPref('http_user'),
		password: getPref('http_pass'),
        dataType: 'json',
        success: function(data) {

            // If there was an error of some type, report it to the user and abort!
            if(data.error) {
                setPref('error', data.error);
                // We allow a custom callback to be passed (ie redrawing the popup html after update)
                if(callBack) {
                    callBack();
                }
                return;
            }
            // This will remove the error
            // Will cause problems if the error pref is used elsewhere to report other errors
            setPref('error', '');

            // Cache the latest update (probably not needed)
            //gSabInfo = data;
            
            setPref('timeleft', data.queue.timeleft);
            
            if(data.queue.speed) {
                // Convert to bytes
                var bytesPerSec = data.queue.kbpersec*1024;
                //var speed = fileSizes(bytesPerSec, 0) + '/s';
                var speed = data.queue.speed + 'B/s';
            } else {
                var speed = '-';
            }
            setPref('speed', speed);
            
            // Do not run this on a quickUpdate (unscheduled refresh)
            if(!quickUpdate) {
                var speedlog = getPref('speedlog');
                
                if(speedlog.length >= 10) {
                    // Only allow 10 values, if at our limit, remove the first value (oldest)
                    speedlog.shift()
                }
                
                speedlog.push(data.queue.kbpersec);
                setPref('speedlog', speedlog);
            }
            
            
            
            if(data.queue.mbleft && data.queue.mbleft > 0) {
                // Convert to bytes
                var bytesLeft = data.queue.mbleft*1048576;
                var queueSize = fileSizes(bytesLeft);
            } else {
                var queueSize = '';
            }
            setPref('sizeleft', queueSize);

            setPref('queue', data.queue.slots);           

            setPref('status', data.queue.status);
            setPref('paused', data.queue.paused);

            // Update the badge
            var badge = {};
            // Set the text on the object to be the number of items in the queue
            // +'' = converts the int to a string.
            badge.text = data.queue.noofslots+'';
            chrome.browserAction.setBadgeText(badge);
            

            // Update the background based on if we are downloading
            if(data.queue.kbpersec && data.queue.kbpersec > 1) {
                badgeColor = {}
                badgeColor.color = new Array(0, 213, 7, 100);
                chrome.browserAction.setBadgeBackgroundColor(badgeColor)
            } else {
                // Not downloading
                badgeColor = {}
                badgeColor.color = new Array(255, 0, 0, 100);
                chrome.browserAction.setBadgeBackgroundColor(badgeColor)
            }
            
            // We allow a custom callback to be passed (ie redrawing the popup html after update)
            if(callBack) {
                callBack();
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            setPref('error', 'Could not connect to SABnzbd - Check it is running, the details in this plugin\'s settings are correct and that you are running at least SABnzbd version 0.5!');
            // We allow a custom callback to be passed (ie redrawing the popup html after update)
            if(callBack) {
                callBack();
            }
        }
    });
    
}