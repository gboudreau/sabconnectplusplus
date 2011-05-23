function setPref(key, value) {
	localStorage[key] = value;
	
	var background = chrome.extension.getBackgroundPage();
	background.reloadConfig();
	
	if (key == 'refresh_rate') {
		background.refreshRateChanged();
	}
}

function getPref(key) {
	var v = localStorage[key];
	if (v == 'true') v = true;
	if (v == 'false') v = false;
	return v;
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

function getRefreshRate()
{
	return parseInt( getPref('refresh_rate') ) * 1000;
}
