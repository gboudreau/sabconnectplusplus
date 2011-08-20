var store = new Store( 'settings' );
var popup = null;
var settings = null;

// This variable serves as a way for the popup (and other pages in the future)
// to determine if this Document object is the settings page.
this.is_sabconnect_settings = true;

var profileMissingErrorMsg =
	'A connection profile exists in the popup but does not exist in localStorage for some reason. '+
	'Please file a bug at the SABconnect++ Google Code page if you see this message and explain '+
	'what you did to reproduce this error.'

var ProfilePopup = new Class({
	'profiles': {},
	
	'initialize': function ( settings )
	{
		this.settings = settings;
	},
	
	'add': function ( name )
	{
		var opt = new Element('option', {
			'id': name,
			'text': name
		});
		
		opt.inject(this.settings.manifest.profile_popup.element);
		this.profiles[name] = opt;
	},
	
	'remove': function ( name )
	{
		this.profiles[name].dispose();
		delete this.profiles[name];
	},
	
	'rename': function( currentName, newName )
	{
		var p = this.profiles[currentName];
		p.set( 'id', newName );
		p.set( 'text', newName );
		
		delete this.profiles[currentName];
		this.profiles[newName] = p;
	},
	
	'setSelection': function( name )
	{
		this.settings.manifest.profile_popup.element.value = name;
	},
	
	'getSelection': function()
	{
		return this.settings.manifest.profile_popup.element.value;
	}
});

function checkForErrors()
{
	// Called after a request to SABnzbd's api has been tried, 'error' should be set if there was an error
	var error = getPref('error');
	if(error) {
		$('connection-status')
			.set( 'class', 'connection-status-failure' )
			.set( 'html', 'Failed' )
			;
	} else {
		$('connection-status')
			.set( 'class', 'connection-status-success' )
			.set( 'html', 'Succeeded' )
			;
	}
	
	// Unsetting error here as otherwise would appear in popup - could confuse the user
	// Could move this just so it is removed when connected successfully
	setPref('error', '');
}

function OnTestConnectionClicked()
{
	$('connection-status')
		.set( 'class', '' )
		.set( 'html', 'Running...' )
		;

	background().testConnection( getConnectionValues(), checkForErrors );
}
	
function RefreshControlStates( settings )
{
	for( var name in settings.manifest ) {
		var setting = settings.manifest[name];
		if( typeOf( setting.set ) === "function" ) {
			setting.set( store.get( setting.params.name ) );
		}
	}
}

function OnResetConfigClicked( settings )
{
	background().resetSettings();
	RefreshControlStates( settings );
}

function OnRefreshRateChanged()
{
	background().restartTimer();
}

function CreateTestConnectionStatusElement( settings )
{
	var resultDiv = new Element( 'div', {
		id: 'connection-status'
	});
	
	resultDiv.inject( settings.manifest.test_connection.container, 'bottom' );
}

function OnToggleContextMenu()
{
	background().SetupContextMenu()
}

function NotifyTabRefresh()
{
	chrome.windows.getAll( {populate: true}, function( windows ) {
		Array.each( windows, function( window ) {
			Array.each( window.tabs, function( tab ) {
				chrome.tabs.sendRequest( tab.id, { action: 'refresh_settings' } );
			});
		});
	});
}

function RegisterContentScriptNotifyHandlers( settings )
{
	Object.each( settings.manifest, function( setting ) {
		if( setting.params.type !== 'button' ) {
			setting.addEvent( 'action', NotifyTabRefresh );
		}
	});
}

function SetupConnectionProfiles( settings )
{
	popup = new ProfilePopup( settings );
	
	var profileNames = store.get( 'profiles' );
	for( var p in profileNames ) {
		popup.add( p );
	}

	changeActiveProfile( profiles.getActiveProfile().name );
}

function getConnectionValues()
{
	return {
		'url': settings.manifest.sabnzbd_url.get(),
		'api_key': settings.manifest.sabnzbd_api_key.get(),
		'username': settings.manifest.sabnzbd_username.get(),
		'password': settings.manifest.sabnzbd_password.get()
	};
}

function setConnectionValues( profileName, url, api_key, username, password )
{
	settings.manifest.profile_name.set( profileName );
	settings.manifest.sabnzbd_url.set( url, true );
	settings.manifest.sabnzbd_api_key.set( api_key, true );
	settings.manifest.sabnzbd_username.set( username, true );
	settings.manifest.sabnzbd_password.set( password, true );
}

function generateUniqueName( name )
{
	var newName = name;
	var counter = 1;
	
	while( profiles.contains( newName ) ) {
		newName = name + counter++;
	}
	
	return newName;
}

function OnCreateProfileClicked()
{
	try {
		var name = generateUniqueName( 'New Profile' );
		
		setConnectionValues( name, '', '', '', '' );
		profiles.add( name, getConnectionValues() );
		profiles.setActiveProfile( name );
		
		popup.add( name );
		popup.setSelection( name );
	}
	catch( e ) {
		throw e;
	}
}

function OnDuplicateProfileClicked()
{
	try {
		var activeProfile = profiles.getActiveProfile();
		var name = generateUniqueName( activeProfile.name );
		
		var values = activeProfile.values;
		setConnectionValues( name, values.url, values.api_key, values.username, values.password );
		profiles.add( name, activeProfile.values );
		profiles.setActiveProfile( name );
		
		popup.add( name );
		popup.setSelection( name );
	}
	catch( e ) {
		throw e;
	}
}

function OnDeleteProfileClicked()
{
	try {
		var selectedProfile = popup.getSelection();
		popup.remove( selectedProfile );
		
		var newActive = profiles.remove( selectedProfile );
		if( newActive ) {
			changeActiveProfile( newActive );
		}
	}
	catch( e ) {
		if( e == 'profile_missing' ) {
			alert( profileMissingErrorMsg );
		}
		else {
			throw e;
		}
	}
}

function changeActiveProfile( profileName )
{
	profiles.setActiveProfile( profileName );
	popup.setSelection( profileName );
	
	var profile = profiles.getActiveProfile().values;
	if( profile) {
		setConnectionValues( profileName, profile.url, profile.api_key, profile.username, profile.password );
	}
}

function OnProfileChanged( profileName )
{
	changeActiveProfile( profileName );
}

function OnConnectionFieldEdited( fieldName, value )
{
	var profile = profiles.getActiveProfile();
	profile.values[fieldName] = value;
	profiles.setProfile( profile );
}

function OnProfileNameChanged( value )
{
	var profileName = profiles.getActiveProfile().name;
	var newProfileName = settings.manifest.profile_name.get();
	if( profileName != newProfileName ) {
		popup.rename( profileName, newProfileName );
		profiles.edit( profileName, getConnectionValues(), newProfileName );
		profiles.setActiveProfile( newProfileName );
	}
}

function AddProfileButtons( settings )
{
	var m = settings.manifest;
	m.profile_create.bundle.inject( m.profile_popup.bundle );
	m.profile_duplicate.bundle.inject( m.profile_popup.bundle );
	m.profile_delete.bundle.inject( m.profile_popup.bundle );
	
	m.profile_popup.container.setStyle( 'display', 'inline-block' );
	m.profile_popup.container.setStyle( 'margin-right', '10');
	m.profile_popup.element.setStyle( 'width', '150');
	m.profile_create.bundle.setStyle( 'display', 'inline-block');
	m.profile_duplicate.bundle.setStyle( 'display', 'inline-block');
	m.profile_delete.bundle.setStyle( 'display', 'inline-block');
	
	m.profile_create.addEvent( 'action', OnCreateProfileClicked );
	m.profile_duplicate.addEvent( 'action', OnDuplicateProfileClicked );
	m.profile_delete.addEvent( 'action', OnDeleteProfileClicked );
	
	m.sabnzbd_url.addEvent( 'action', function(v) { OnConnectionFieldEdited( 'url', v ) } );
	m.sabnzbd_api_key.addEvent( 'action', function(v) { OnConnectionFieldEdited( 'api_key', v ) } );
	m.sabnzbd_username.addEvent( 'action', function(v) { OnConnectionFieldEdited( 'username', v ) } );
	m.sabnzbd_password.addEvent( 'action', function(v) { OnConnectionFieldEdited( 'password', v ) } );
	
	m.profile_name.element.addEvent( 'blur', OnProfileNameChanged );
}

function InitializeSettings( settings )
{
	this.settings = settings;
	
	settings.manifest.config_reset.addEvent( 'action', OnResetConfigClicked );
	settings.manifest.test_connection.addEvent( 'action', OnTestConnectionClicked );
	settings.manifest.config_refresh_rate.addEvent( 'action', OnRefreshRateChanged );
	settings.manifest.config_enable_context_menu.addEvent( 'action', OnToggleContextMenu );
	settings.manifest.profile_popup.addEvent( 'action', OnProfileChanged );

	CreateTestConnectionStatusElement( settings );
	SetupConnectionProfiles( settings );
	AddProfileButtons( settings );
	RegisterContentScriptNotifyHandlers( settings );
}

window.addEvent( 'domready', function () {
	new FancySettings.initWithManifest( InitializeSettings );
});

window.onbeforeunload = function() {
	var profile_name = settings.manifest.profile_name.get();
	if( profiles.getActiveProfile().name !== profile_name ) {
		var msg =
			'You have made changes to the active profile\'s name, ' +
			'but it has not been saved. Click out of the "Profile Name" ' +
			'text field to save the changes. You may also leave the ' +
			'options page now to discard those changes.'
			;
			
		return msg;
	}
};