function AddLinkResult( result, data )
{
	switch( result.ret )
	{
	case 'success':
		break;
	case 'error':
		alert( 'Attempt to add a URL to SabNZBd via context menu failed' );
		break;
	}
}

function ContextClicked( info, tab )
{
	var request = {
		mode: 'addurl',
		nzburl: info.linkUrl
	};
	
	addToSABnzbd( request, AddLinkResult );
}

function CreateContextMenuResult()
{
	var error = chrome.extension.lastError;
	if( error )
	{
		alert(
			'The context menu for SabConnect++ failed to load.\n\nDetails:\t' + error
		);
	}
}

function CreateContextMenu()
{
	var urlPatterns = [
		'http://*/*'
	]
	
	var properties = {
		type: 'normal',
		title: 'Send link to SABnzbd',
		contexts: ['link'],
		onclick: ContextClicked,
		targetUrlPatterns: urlPatterns
	}
	
	chrome.contextMenus.create( properties, CreateContextMenuResult );
	console.log( 'Context menu created' );
}

function DestroyContextMenu()
{
	chrome.contextMenus.removeAll();
	console.log( 'Context menu destroyed' );
}

function SetupContextMenu()
{
	if( store.get( 'config_enable_context_menu' ) )
	{
		CreateContextMenu();
	}
	else
	{
		DestroyContextMenu();
	}
}
