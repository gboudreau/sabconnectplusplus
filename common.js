function setPref(key, value) {
  var config = {};
  if (localStorage.config) {
    config = JSON.parse(localStorage.config);
  }
  config[key] = value;
  chrome.extension.sendRequest({action : 'reloadConfig'});
  localStorage.config = JSON.stringify(config);
}

function getPref(key) {
	var config = getAllPrefs();
	return config[key];
}

function getAllPrefs()
{
  if (!localStorage.config) {
    return undefined;
  }
  return JSON.parse(localStorage.config);
}

function checkEndSlash(input) {
    if (input.charAt(input.length-1) == '/') {
        return input;
    } else {
        var output = input+'/';
        return output;
    }
}

function constructApiUrl() {
        var sabUrl = checkEndSlash(getPref('sab_url')) + 'api';
    return sabUrl;
}

// hasJsConfig = has local html javascript
function constructApiPost(hasJsConfig) {

    //if (hasJsConfig) {
        var apikey = getPref('api_key');
    //} else {
    //    var apikey = gConfig.api_key;
    //}

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
		}, function(response) {
			switch(response.ret)
			{
			case 'error' :
				alert("Could not contact SABnzbd \n Check it is running and your settings are correct");
				var img = chrome.extension.getURL('images/sab2_16_red.png');
				$(addLink).find('img').attr('src', img);	
				return;
			case 'success' :
				// If there was an error of some type, report it to the user and abort!
				if(response.data.error) {
					alert(response.data.error);
					var img = chrome.extension.getURL('images/sab2_16_red.png');
					$(addLink).find('img').attr('src', img);	
					return;
				}
				var img = chrome.extension.getURL('images/sab2_16_green.png');
				$(addLink).find('img').attr('src', img);	
				return;
			default:
				alert("Ups something went wrong try again");
			}
		});
		return;
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