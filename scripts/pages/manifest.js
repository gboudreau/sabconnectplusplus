// SAMPLE MANIFEST
this.manifest = {
	'name': 'SABConnect++ Settings',
	'icon': 'images/sab2_32.png',
	'settings': [
	
		// Connections Tab
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
					so it can download it.'
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
			'name': 'provider_',
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
			'name': 'provider_newzleech',
			'type': 'checkbox',
			'label': 'newzleech.com'
		},
		{
			'tab': 'Providers',
			'group': '1-Click NZB downloading',
			'name': 'provider_nzbs',
			'type': 'checkbox',
			'label': 'nzbs.org'
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
			'name': 'provider_nzb',
			'type': 'checkbox',
			'label': 'nzb.su'
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
			'name': 'provider_fanzub',
			'type': 'checkbox',
			'label': 'fanzub.com'
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
			'label': 'binsearch.info: Use NZB filename instead of full name.'
		},
		{
			'tab': 'Providers',
			'group': 'Display Options',
			'name': 'use_name_nzbindex',
			'type': 'checkbox',
			'label': 'nzbindex.com: Use NZB filename instead of full name.'
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
				{ value: 0, text: 'Disabled' },
				{ value: 1, text: '1 second' },
				{ value: 2, text: '2 seconds' },
				{ value: 4, text: '4 seconds' },
				{ value: 8, text: '8 seconds' },
				{ value: 15, text: '15 seconds' },
				{ value: 30, text: '30 seconds' },
				{ value: 60, text: '1 minute' },
				{ value: 120, text: '2 minutes' },
				{ value: 300, text: '5 minutes' },
				{ value: 900, text: '15 minutes' },
				{ value: 1800, text: '30 minutes' },
				{ value: 3600, text: '1 hour' },
				{ value: 7200, text: '2 hours' },
				{ value: 14400, text: '4 hours' }
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
			'name': 'config_notification_timeout',
			'type': 'popupButton',
			'label': 'Notification Timeout:',
			'options':
			[
				{ value: 0, text: 'Disabled' },
				{ value: 10, text: '10 seconds' },
				{ value: 15, text: '15 seconds' },
				{ value: 20, text: '20 seconds' },
				{ value: 30, text: '30 seconds' },
				{ value: 45, text: '45 seconds' },
				{ value: 60, text: '1 minute' },
				{ value: 120, text: '2 minutes' },
				{ value: 300, text: '5 minutes' },
				{ value: 1800, text: '30 minutes' },
				{ value: 3600, text: '1 hour' }
			]
		},
		
		// Configuration Tab, Categories section
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
