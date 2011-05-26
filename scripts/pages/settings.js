function OnResetConfigClicked()
{
	var background = chrome.extension.getBackgroundPage();
	background.resetSettings();
	alert( 'Settings Reset' );
}

function SetupEventHandlers( settings )
{
	settings.manifest.config_reset.addEvent( 'action', OnResetConfigClicked );
}

window.addEvent("domready", function () {
	new FancySettings.initWithManifest( SetupEventHandlers );
});