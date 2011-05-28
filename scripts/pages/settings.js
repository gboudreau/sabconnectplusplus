var store = new Store( 'settings' );

function checkForErrors() {
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
		
	var background = chrome.extension.getBackgroundPage()
	background.testConnection( checkForErrors );
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
	var background = chrome.extension.getBackgroundPage();
	background.resetSettings();
	RefreshControlStates( settings );
}

function InitializeSettings( settings )
{
	settings.manifest.config_reset.addEvent( 'action', bind( OnResetConfigClicked, settings ) );
	settings.manifest.test_connection.addEvent( 'action', OnTestConnectionClicked );

	var resultDiv = new Element( 'div', {
		id: 'connection-status'
	});
	
	resultDiv.inject( settings.manifest.test_connection.container, 'bottom' );
}

window.addEvent("domready", function () {
	new FancySettings.initWithManifest( InitializeSettings );
});