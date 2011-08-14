var profiles = new ProfileManager();

function background()
{
	return chrome.extension.getBackgroundPage();
}

function activeProfile()
{
	return profiles.getActiveProfile().values;
}

function setPref(key, value) {
	localStorage[key] = value;
	
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

function constructApiUrl( profileValues ) {
	var profile = profileValues || activeProfile();
	return checkEndSlash( profile.url ) + 'api';
}

function constructApiPost( profileValues ) {
	var profile = profileValues || activeProfile();
	var data = {};
	
	var apikey = profile.api_key;
	if( apikey ) {
		data.apikey = apikey;
	}

	var username = profile.username;
	if( username ) {
		data.ma_username = username;
	}

	var password = profile.password;
	if( password ) {
		data.ma_password = password;
	}
	
	return data;
}

function getRefreshRate()
{
	return parseInt( background().store.get( 'config_refresh_rate' ) ) * 1000;
}

/// Used to merge two associative arrays.
function combine( dst, src )
{
	for( var property in src ) {
		if( src.hasOwnProperty( property ) ) {
			dst[property] = src[property];
		}
	}
	
	return dst;
}