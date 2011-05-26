function RefreshControlStates( settings )
{
	var store = new Store( 'settings' );
	for( var name in settings.manifest ) {
		var setting = settings.manifest[name];
		if( typeOf(setting.set) === "function" ) {
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

function SetupEventHandlers( settings )
{
	settings.manifest.config_reset.addEvent( 'action', bind( OnResetConfigClicked, settings ) );
}

window.addEvent("domready", function () {
	new FancySettings.initWithManifest( SetupEventHandlers );
});