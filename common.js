function setPref(key, value) {
	localStorage[key] = value;
	chrome.extension.sendRequest({action : 'reloadConfig'});
}

function getPref(key) {
	var v = localStorage[key];
	if (v == 'true') v = true;
	if (v == 'false') v = false;
	return v;
}

function getAllPrefs() {
	return localStorage;
}

function setDefaults() {
	if(!getPref('sab_url')) setPref('sab_url', 'http://localhost:8080/sabnzbd/');
	if(!getPref('api_key')) setPref('api_key', '');
	if(!getPref('http_user')) setPref('http_user', '');
	if(!getPref('http_pass')) setPref('http_pass', '');
	if(!getPref('speedlog')) setPref('speedlog', JSON.stringify([]));
	if(getPref('show_graph') == null) setPref('show_graph', 0);
	if(getPref('enable_newzbin') == null) setPref('enable_newzbin', 1);
	if(getPref('enable_nzbmatrix') == null) setPref('enable_nzbmatrix', 1);
	if(getPref('enable_nzbclub') == null) setPref('enable_nzbclub', 1);
	if(getPref('enable_bintube') == null) setPref('enable_bintube', 1);
	if(getPref('enable_newzleech') == null) setPref('enable_newzleech', 1);
	if(getPref('enable_nzbsorg') == null) setPref('enable_nzbsorg', 1);
	if(getPref('enable_binsearch') == null) setPref('enable_binsearch', 1);
	if(getPref('enable_nzbindex') == null) setPref('enable_nzbindex', 1);
	if(getPref('enable_nzbsrus') == null) setPref('enable_nzbsrus', 1);
 
	// Force this back to 0 just incase
	setPref('skip_redraw', 0);
	
	if(getPref('refresh_rate') == null) setPref('refresh_rate', 15);
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

function constructApiPost() {
	var data = {};
	
	var apikey = getPref('api_key');
	if (apikey) {
		data.apikey = apikey;
	}

	var username = getPref('http_user');
	if (username) {
		data.ma_username = username;
	}

	var password = getPref('http_pass');
	if (password) {
		data.ma_password = password;
	}
	
	return data;
}

function addToSABnzbd(addLink, nzburl, mode, nice_name, category) {
	var req = {'action' : 'addToSABnzbd',
	'nzburl' : nzburl,
	'mode' : mode
	};
	
	if (typeof nice_name != 'undefined') {
		req['nzbname'] = nice_name;
	}

	if (typeof category != 'undefined') {
		req['category'] = category;
	}

	chrome.extension.sendRequest(
		req, function(response) {
			switch(response.ret)
			{
			case 'error' :
				alert("Could not contact SABnzbd \n Check it is running and your settings are correct");
				var img = chrome.extension.getURL('images/sab2_16_red.png');
				if ($(this).find('img').length > 0) {
				    $(addLink).find('img').attr("src", img);
				} else {
					$(addLink).css('background-image', 'url('+img+')');
				}
				return;
			case 'success' :
				// If there was an error of some type, report it to the user and abort!
				if (response.data.error) {
					alert(response.data.error);
					var img = chrome.extension.getURL('images/sab2_16_red.png');
					if ($(this).find('img').length > 0) {
					    $(addLink).find('img').attr("src", img);
					} else {
						$(addLink).css('background-image', 'url('+img+')');
					}
					return;
				}
				var img = chrome.extension.getURL('images/sab2_16_green.png');
				if ($(addLink).find('img').length > 0) {
				    $(addLink).find('img').attr("src", img);
				} else {
					$(addLink).css('background-image', 'url('+img+')');
				}
				return;
			default:
				alert("Oops! Something went wrong. Try again.");
			}
		});
		return;
}


function moveQueueItem(nzoid, pos) {
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
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
	var data = constructApiPost();
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
	if(decimals == null) decimals = 2;
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
 *	 If set to true, will not update the graph ect, currently used when a queue item has been moved/deleted in order to refresh the queue list
 */
function fetchInfo(quickUpdate, callBack) {

	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
	
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
			if(data != null && data.error) {
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
			
			setPref('timeleft', data.queue.timeleft);
			
			if(data.queue.speed) {
				// Convert to bytes
				var bytesPerSec = data.queue.kbpersec*1024;
				var speed = data.queue.speed + 'B/s';
			} else {
				var speed = '-';
			}
			setPref('speed', speed);
			
			// Do not run this on a quickUpdate (unscheduled refresh)
			if(!quickUpdate) {
				var speedlog = JSON.parse(getPref('speedlog'));
				
				if(speedlog.length >= 10) {
					// Only allow 10 values, if at our limit, remove the first value (oldest)
					speedlog.shift();
				}
				
				speedlog.push(data.queue.kbpersec);
				setPref('speedlog', JSON.stringify(speedlog));
			}
			
			if(data.queue.mbleft && data.queue.mbleft > 0) {
				// Convert to bytes
				var bytesLeft = data.queue.mbleft*1048576;
				var queueSize = fileSizes(bytesLeft);
			} else {
				var queueSize = '';
			}
			setPref('sizeleft', queueSize);

			setPref('queue', JSON.stringify(data.queue.slots));		   

			setPref('status', data.queue.status);
			setPref('paused', data.queue.paused);

			// Update the badge
			var badge = {};
			// Set the text on the object to be the number of items in the queue
			// +'' = converts the int to a string.
			if (data.queue.noofslots == 0) {
				badge.text = '';
			} else {
				badge.text = data.queue.noofslots+'';
			}
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