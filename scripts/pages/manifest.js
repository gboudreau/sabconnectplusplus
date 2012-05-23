this.manifest = {
	'name': 'SABConnect++ Settings',
	'icon': 'images/sab2_48.png',
	'alignment': [
		[
			//'profile',
			'profile_name',
			'sabnzbd_url',
			'sabnzbd_api_key',
			'sabnzbd_username',
			'sabnzbd_password'
		],
		[
			'nzbxxx_username',
			'nzbxxx_api_key'
		],
		[
			'config_hard_coded_category',
			'config_default_category'
		],
		[
			'config_refresh_rate',
			'config_notification_timeout'
		],
	],
	'settings': [
		// Connections Tab
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'profile_popup',
			'type': 'popupButton',//'listBox',
			'label': 'Connection Profile:'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'profile_create',
			'type': 'button',
			'text': 'Create'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'profile_duplicate',
			'type': 'button',
			'text': 'Duplicate'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'profile_delete',
			'type': 'button',
			'text': 'Delete'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'profile_name',
			'type': 'text',
			'label': 'Profile Name:'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'sabnzbd_url',
			'type': 'text',
			'label': 'SABnzbd URL:'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'sabnzbd_api_key',
			'type': 'text',
			'label': 'SABnzbd API Key:'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'sabnzbd_username',
			'type': 'text',
			'label': 'SABnzbd Username:'
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'sabnzbd_password',
			'type': 'text',
			'label': 'SABnzbd Password:',
				'masked': true
		},
		{
			'tab': 'Connection',
			'group': 'Connection Information',
			'name': 'test_connection',
			'type': 'button',
			'text': 'Test Connection'
		},
		
		// Providers Tab, NZB downloading section
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_description',
			'type': 'description',
			'text':
					'This is a list of currently supported providers. For each provider that is\
					enabled, 1-click NZB downloading will be supported. This sends the NZB to SABnzbd\
					so it can be downloaded.'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_newzbin',
			'type': 'checkbox',
			'label': 'Newzbin / Newzxxx *'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_nzbmatrix',
			'type': 'checkbox',
			'label': 'NZBMatrix / NZBxxx *'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_nzbclub',
			'type': 'checkbox',
			'label': 'nzbclub.com'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_bintube',
			'type': 'checkbox',
			'label': 'bintube.com'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_nzb',
			'type': 'checkbox',
			'label': 'Newznab (nzbs.org, nzb.su, nzbhq.com)'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_binsearch',
			'type': 'checkbox',
			'label': 'binsearch.info'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_nzbindex',
			'type': 'checkbox',
			'label': 'nzbindex.com'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_nzbsrus',
			'type': 'checkbox',
			'label': 'nzbsrus.com'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_fanzub',
			'type': 'checkbox',
			'label': 'fanzub.com'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_dognzb',
			'type': 'checkbox',
			'label': 'dognzb.cr'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_notice',
			'type': 'description',
			'text':
					'<br />* This provider requires authentication credentials (which must be provided\
					in SABnzbd settings) and/or credit to be used.'
		},
		
		// Providers Tab, display section
		{
			'tab': 'Providers',
			'group': 'Display Options',
			'name': 'use_name_binsearch',
			'type': 'checkbox',
			'label': 'binsearch.info: Use display name instead of NZB filename.'
		},
		{
			'tab': 'Providers',
			'group': 'Display Options',
			'name': 'use_name_nzbindex',
			'type': 'checkbox',
			'label': 'nzbindex.com: Use display name instead of NZB filename.'
		},
		
		// Providers Tab, NZBXXX.com section
		{
			'tab': 'Providers',
			'group': 'NZBXXX.com',
			'name': 'nzbxxx_username',
			'type': 'text',
			'label': 'Username:'
		},
		{
			'tab': 'Providers',
			'group': 'NZBXXX.com',
			'name': 'nzbxxx_api_key',
			'type': 'text',
			'label': 'API Key:'
		},
		
		// Configuration Tab, General section
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_refresh_rate',
			'type': 'popupButton',
			'label': 'Refresh Rate:',
			'options':
			[
				[ 0, 'Disabled' ],
				[ 1, '1 second' ],
				[ 2, '2 seconds' ],
				[ 4, '4 seconds' ],
				[ 8, '8 seconds' ],
				[ 15, '15 seconds' ],
				[ 30, '30 seconds' ],
				[ 60, '1 minute' ],
				[ 120, '2 minutes' ],
				[ 300, '5 minutes' ],
				[ 900, '15 minutes' ],
				[ 1800, '30 minutes' ],
				[ 3600, '1 hour' ],
				[ 7200, '2 hours' ],
				[ 14400, '4 hours' ]
			]
		},
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_notification_timeout',
			'type': 'popupButton',
			'label': 'Notification Timeout:',
			'options':
			[
				[ 0, 'Disabled' ],
				[ 10, '10 seconds' ],
				[ 15, '15 seconds' ],
				[ 20, '20 seconds' ],
				[ 30, '30 seconds' ],
				[ 45, '45 seconds' ],
				[ 60, '1 minute' ],
				[ 120, '2 minutes' ],
				[ 300, '5 minutes' ],
				[ 1800, '30 minutes' ],
				[ 3600, '1 hour' ]
			]
		},
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_enable_graph',
			'type': 'checkbox',
			'label': 'Enable Graph'
		},
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_enable_context_menu',
			'type': 'checkbox',
			'label': 'Enable Context Menu'
		},
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_enable_notifications',
			'type': 'checkbox',
			'label': 'Enable Notifications'
		},
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_enable_automatic_authentication',
			'type': 'checkbox',
			'label': 'Enable Automatic Authentication (insecure)'
		},
		{
			'tab': 'Configuration',
			'group': 'General',
			'name': 'config_reset',
			'type': 'button',
			'label': 'Click to reset all settings to default:',
			'text': 'Reset'
		},
		
		// Configuration Tab, Categories section
		{
			'tab': 'Configuration',
			'group': 'Categories',
			'name': 'config_category_summary',
			'type': 'description',
			'text':
					'Below are the category settings provided by SABconnect++. For more information regarding categories,\
					please read the <a href="http://code.google.com/p/sabconnectplusplus/wiki/Categories">wiki page</a>.'
		},
		{
			'tab': 'Configuration',
			'group': 'Categories',
			'name': 'config_use_category_header',
			'type': 'checkbox',
			'label': 'Use X-DNZB-Category HTTP header instead of auto-categorization\
					on supported sites (NZBs.org, Newzbin).'
		},
		{
			'tab': 'Configuration',
			'group': 'Categories',
			'name': 'config_hard_coded_category',
			'type': 'text',
			'label': 'Hard-coded Category:'
		},
		{
			'tab': 'Configuration',
			'group': 'Categories',
			'name': 'config_category_desc1',
			'type': 'description',
			'text':
					'Will use this category for <u><b>all</b></u> downloads sent to SABnzbd.'
		},
		{
			'tab': 'Configuration',
			'group': 'Categories',
			'name': 'config_default_category',
			'type': 'text',
			'label': 'Default Category:'
		},
		{
			'tab': 'Configuration',
			'group': 'Categories',
			'name': 'config_category_desc2',
			'type': 'description',
			'text':
					'Will use this category if no category can be obtained from the NZB index site.'
		},
	]
};
