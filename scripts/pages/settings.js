var store = new Store( 'settings' );
var popup = null;
var settings = null;

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

function OnAddProfileClicked()
{
	try {
		var profileName = store.get( 'profile_name' );
		profiles.add( profileName, getConnectionValues() );
		profiles.setActiveProfile( profileName );
		
		popup.add( profileName );
		popup.setSelection( profileName );
	}
	catch( e ) {
		if( e == 'already_exists' ) {
			alert( 'A connection profile with that name already exists. Please choose another name.' );
		}
		else {
			throw e;
		}
	}
}

function OnEditProfileClicked()
{
	try {
		var profileName = popup.getSelection();
		var newProfileName = store.get( 'profile_name' );
		
		profiles.edit( profileName, getConnectionValues() );
		
		if( profileName != newProfileName ) {
			popup.rename( profileName, newProfileName );
		}
	}
	catch( e ) {
		if( e == 'profile_missing' ) {
			alert( profileMissingErrorMsg );
		}
		else if( e == 'renamed_exists' ) {
			alert(
				'This connection profile is being edited to have a different profile name that '+
				'already exists. Please change the name of this profile so that it is unique.'
				);
		}
		else {
			throw e;
		}
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
		settings.manifest.profile_name.set( profileName );
		settings.manifest.sabnzbd_url.set( profile.url );
		settings.manifest.sabnzbd_api_key.set( profile.api_key );
		settings.manifest.sabnzbd_username.set( profile.username );
		settings.manifest.sabnzbd_password.set( profile.password );
	}
}

function OnProfileChanged( profileName )
{
	changeActiveProfile( profileName );
}

function AddProfileButtons( settings )
{
	var m = settings.manifest;
	m.profile_add.bundle.inject( m.profile_popup.bundle );
	m.profile_edit.bundle.inject( m.profile_popup.bundle );
	m.profile_delete.bundle.inject( m.profile_popup.bundle );
	
	m.profile_popup.container.setStyle( 'display', 'inline-block' );
	m.profile_popup.container.setStyle( 'margin-right', '10');
	m.profile_popup.element.setStyle( 'width', '150');
	m.profile_add.bundle.setStyle( 'display', 'inline-block');
	m.profile_edit.bundle.setStyle( 'display', 'inline-block');
	m.profile_delete.bundle.setStyle( 'display', 'inline-block');
	
	m.profile_add.addEvent( 'action', OnAddProfileClicked );
	m.profile_edit.addEvent( 'action', OnEditProfileClicked );
	m.profile_delete.addEvent( 'action', OnDeleteProfileClicked );
}

function InitializeSettings( settings )
{
	this.settings = settings;
	
	settings.manifest.config_reset.addEvent( 'action', bind( OnResetConfigClicked, settings ) );
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