// SAMPLE MANIFEST
this.manifest = {
    'name': 'SABConnect++ Settings',
    'icon': 'images/sab2_32.png',
    'settings': [
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
            'label': 'Newzbin / Newzxxx'
        },
        {
            'tab': 'Providers',
            'group': '1-Click NZB downloading',
            'name': 'provider_',
            'type': 'checkbox',
            'label': 'NZBMatrix / NZBxxx'
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
    ]
};
