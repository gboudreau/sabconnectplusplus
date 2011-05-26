function RefreshControlStates( settings )
{
	var store = new Store( 'settings' );
	Object.each( settings.manifest, function( setting ) {
		setting.set( store.get( setting.params.name ) );
	});
}

function OnResetConfigClicked( settings )
{
	var background = chrome.extension.getBackgroundPage();
	background.resetSettings();
	RefreshControlStates( settings );
}

function SetupEventHandlers( settings )
{
	settings.manifest.config_reset.addEvent( 'action', bind( OnResetConfigClicked, settings ) );
}

window.addEvent("domready", function () {
	new FancySettings.initWithManifest( SetupEventHandlers );
});