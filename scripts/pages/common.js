function background()
{
	return chrome.extension.getBackgroundPage();
}

function setPref(key, value) {
	localStorage[key] = value;
	
	background().reloadConfig();
	
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
	var url = background().store.get('sabnzbd_url');
	return checkEndSlash( url ) + 'api';
}

function constructApiPost() {
	var store = background().store;
	var data = {};
	
	var apikey = store.get( 'sabnzbd_api_key' );
	if( apikey ) {
		data.apikey = apikey;
	}

	var username = store.get( 'sabnzbd_username' );
	if( username ) {
		data.ma_username = username;
	}

	var password = store.get( 'sabnzbd_password' );
	if( password ) {
		data.ma_password = password;
	}
	
	return data;
}

function getRefreshRate()
{
	return parseInt( background().store.get( 'config_refresh_rate' ) ) * 1000;
}
