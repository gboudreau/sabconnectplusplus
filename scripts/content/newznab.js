
(function() { // Encapsulate

	var queryString = '',
		oneClickImgTag = '<img style="vertical-align:baseline" src="' + chrome.runtime.getURL('/images/content_icon.png') + '" />',
		ignoreCats,
		linkRelAlternate = $('link[rel=alternate]').attr('href');

	// Debug authentication parameters
	var uid = $('[name=UID]').val();
	var rsstoken = $('[name=RSSTOKEN]').val();
	console.log('SABconnect++ Newznab: Authentication debug:');
	console.log('SABconnect++ Newznab: UID found:', uid ? 'Yes (' + uid + ')' : 'No');
	console.log('SABconnect++ Newznab: RSSTOKEN found:', rsstoken ? 'Yes (' + rsstoken.substring(0, 10) + '...)' : 'No');
	console.log('SABconnect++ Newznab: Link rel=alternate:', linkRelAlternate);

	// Build authentication queryString only if we have valid authentication
	if (uid && rsstoken) {
		queryString = '?i=' + uid + '&r=' + rsstoken + '&del=1';
		console.log('SABconnect++ Newznab: Using standard form auth');
	} else if (linkRelAlternate && linkRelAlternate.match(/[\?&]i=.+$/)) {
		var found = linkRelAlternate.match(/[\?&](i=.+$)/);
		queryString = '?' + found[1];
		console.log('SABconnect++ Newznab: Using queryString from link rel=alternate:', queryString);
	} else {
		console.log('SABconnect++ Newznab: Standard auth not found, trying alternatives...');
		
		// Try to find auth in meta tags
		var metaUID = $('meta[name="uid"]').attr('content');
		var metaToken = $('meta[name="rsstoken"]').attr('content');
		
		// Try to find auth in data attributes
		var dataUID = $('[data-uid]').attr('data-uid');
		var dataToken = $('[data-rsstoken]').attr('data-rsstoken');
		
		// Try to find auth in the page source/scripts
		var scriptUID = null, scriptToken = null;
		$('script').each(function() {
			var scriptText = $(this).text();
			var uidMatch = scriptText.match(/uid['":\s]*['"]([^'"]+)['"]/i);
			var tokenMatch = scriptText.match(/(?:rsstoken|apikey|token)['":\s]*['"]([^'"]+)['"]/i);
			if (uidMatch) scriptUID = uidMatch[1];
			if (tokenMatch) scriptToken = tokenMatch[1];
		});
		
		console.log('SABconnect++ Newznab: Alternative auth search:');
		console.log('SABconnect++ Newznab: Meta UID:', metaUID);
		console.log('SABconnect++ Newznab: Meta Token:', metaToken);
		console.log('SABconnect++ Newznab: Data UID:', dataUID);
		console.log('SABconnect++ Newznab: Data Token:', dataToken);
		console.log('SABconnect++ Newznab: Script UID:', scriptUID);
		console.log('SABconnect++ Newznab: Script Token:', scriptToken);
		
		// Use alternative auth if found
		if (metaUID && metaToken) {
			queryString = '?i=' + metaUID + '&r=' + metaToken + '&del=1';
			console.log('SABconnect++ Newznab: Using meta auth');
		} else if (dataUID && dataToken) {
			queryString = '?i=' + dataUID + '&r=' + dataToken + '&del=1';
			console.log('SABconnect++ Newznab: Using data auth');
		} else if (scriptUID && scriptToken) {
			queryString = '?i=' + scriptUID + '&r=' + scriptToken + '&del=1';
			console.log('SABconnect++ Newznab: Using script auth');
		} else {
			console.log('SABconnect++ Newznab: No authentication found - will use URLs as-is');
		}
	}

	console.log('SABconnect++ Newznab: Final queryString:', queryString);

	GetSetting('config_ignore_categories', function( value ) {
		ignoreCats = value;
	});

	function addMany(e) {

		var $button = $(this);

		$button.val("Sending...");

		$('#browsetable ' + e.data.selector).each(function() {
			addOne($(this).closest('tr'));
		});

		$button.val('Sent to SABnzbd!');

		setTimeout(function() {
			$button.val('Send to SABnzbd');
		}, 4000);

		return false;
	}

	// $tr is a table row from #browsetable (one nzb)
	function uploadFileDirectly($tr, $anchor, nzbUrl, category) {
		fetch(nzbUrl)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const responseHeaders = response.headers;
				return response.text().then(text => ({ text, responseHeaders }));
			})
			.then(({ text, responseHeaders }) => {
				if (!text.includes('<?xml') && !text.includes('<nzb')) {
					throw new Error('Downloaded content is not a valid NZB file');
				}
				if (text.includes('<html') || text.includes('<HTML')) {
					throw new Error('Downloaded content is an HTML page, not an NZB file');
				}

				let nzbFilename = 'download.nzb';
				const contentDisposition = responseHeaders.get('content-disposition');
				if (contentDisposition) {
					const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
					if (filenameMatch && filenameMatch[1]) {
						nzbFilename = filenameMatch[1].replace(/['"]/g, '');
					}
				}
				if (nzbFilename === 'download.nzb') {
					var titleText = $tr.find('a.title, a[href*="/details/"]').first().text().trim();
					if (titleText) {
						nzbFilename = titleText.replace(/[<>:"/\\|?*]/g, '_') + '.nzb';
					}
				}

				const blob = new Blob([text], { type: 'application/x-nzb' });
				const reader = new FileReader();
				reader.onload = function() {
					const base64data = reader.result.split(',')[1];
					chrome.runtime.sendMessage({
						action: 'uploadNZBFile',
						fileData: base64data,
						filename: nzbFilename,
						category: category
					}, function(response) {
						onResponseAdd(response || { ret: 'success', data: {} }, $anchor.get(0));
					});
				};
				reader.readAsDataURL(blob);
			})
			.catch(error => {
				onResponseAdd({ ret: 'error' }, $anchor.get(0));
			});
	}

	function addOne($tr) {

		var $anchor = $tr.find('a.addSABnzbd');

		// Set the image to an in-progress image
		var img = chrome.runtime.getURL('images/content_icon_fetching.png');

		if ($($anchor.get(0)).find('img').length > 0) {
			$($anchor.get(0)).find('img').attr("src", img);
		}

		var category = null;
		if (!ignoreCats) {
			$tr.parent().find('tr:nth-child(1)').find('th').each(function(i) {
				if (!category && $.trim($(this).text().toLowerCase()) === 'category') {
					var catText = $.trim($tr.find(`td:nth-child(${i + 1})`).text());
					var catMatch = catText.match(/^\s*([^> -]+)/);
					if (catMatch) {
						category = catMatch[1];
					}
				}
			});
		}

		var nzbUrl = $anchor.attr('href');

		if (window.location.hostname.includes('nzbfinder.ws') || window.location.hostname.includes('nzbstars.com') || !queryString) {
			uploadFileDirectly($tr, $anchor, nzbUrl, category);
			return;
		}

		if (queryString) {
			nzbUrl += (nzbUrl.indexOf('?') !== -1 ? queryString.replace(/^\?/, '&') : queryString);
		}

		addToSABnzbd(
			$anchor.get(0),
			nzbUrl,
			'addurl',
			null,
			category
		);
	}

	Initialize('newznab', null, function() {
		console.log('SABconnect++ Newznab: Script initialized');
		console.log('SABconnect++ Newznab: Found existing addSABnzbd links:', $('a.addSABnzbd').length);

		if ($('a.addSABnzbd').length == 0) {
			// Cover view: Loop through each #coverstable and #browselongtable row and add a one click link next to the download link
			console.log('SABconnect++ Newznab: Checking cover view tables');
			console.log('SABconnect++ Newznab: #coverstable rows:', $('#coverstable > tbody > tr:gt(0)').length);
			console.log('SABconnect++ Newznab: #browselongtable rows:', $('#browselongtable > tbody > tr:gt(0)').length);
			$.merge(
				$('#coverstable > tbody > tr:gt(0)'),
				$('#browselongtable > tbody > tr:gt(0)')
			).each(function() {
				var $tr = $(this);

				$("div.icon_nzb", $tr).each(function() {
					var href = $("a", this).attr("href");
					$(this).before('<div class="icon"><a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a></div>')
				});

				$tr.find('a.addSABnzbd')
					.on('click', function(e) {
						e.preventDefault();
						e.stopPropagation();
						addOne($(this).closest('tr'));
						return false;
					})
				;
			});
		}

		if ($('a.addSABnzbd').length == 0) {
			// List view: Loop through all the td.check items and add a one-click link next the nearby title
			console.log('SABconnect++ Newznab: Checking list view');
			console.log('SABconnect++ Newznab: td.check elements:', $('td.check, td:has(input[type="checkbox"])').length);
			$('td.check, td:has(input[type="checkbox"])').each(function() {
				var $tr = $(this).parent(),
					href = $tr.find('.icon_nzb a').attr('href') || $tr.find('a.icon_nzb').attr('href') || $tr.find('a#downloadlink').attr('href') || $tr.find('a[href*="getnzb"]').attr('href') || $tr.find('a.nzb-download').attr('href');

				if (!href || $tr.find('a.addSABnzbd').length > 0) {
					return;
				}

				$tr.find('a.title, a[href*="/details/"]').first().parent()
					.prepend('<a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a>')
				;

				$tr.find('a.addSABnzbd')
					.on('click', function(e) {
						e.preventDefault();
						e.stopPropagation();
						addOne($(this).closest('tr'));
						return false;
					})
				;
			});
		}

		if ($('a.addSABnzbd').length == 0) {
			// Details view (etc.)
			console.log('SABconnect++ Newznab: Checking details view');
			console.log('SABconnect++ Newznab: div.icon_nzb elements:', $('div.icon_nzb').length);
			$('div.icon_nzb').each(function() {
				var $tr = $(this),
					href = $(this).children("a").attr('href');

				$tr
					.before('<div class="icon"><a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a></div>')
				;

				$tr.parent().find('a.addSABnzbd')
					.on('click', function(e) {
						e.preventDefault();
						e.stopPropagation();
						addOne($(this).closest('tr'));
						return false;
					})
				;
			});
		}

		if ($('a.addSABnzbdDetails').length == 0) {
			// Details view: Find the download buttons, and prepend a sabnzbd button
			$('table#detailstable .icon_nzb').parents('td').each(function() {
				var $tdWithButtons = $(this),
					href = 	$tdWithButtons.find('.icon_nzb a').attr('href'),
					oneClickButton = '<div class="icon"><a class="addSABnzbdDetails" href="' + href + '">' + oneClickImgTag + '</a></div>';

				$('#infohead').append(oneClickButton);

				$tdWithButtons.prepend(oneClickButton)
					.find('a.addSABnzbdDetails')
					.add('#infohead .addSABnzbdDetails')
					.on('click', function() {
						var category = null;
						if ($('table#detailstable a[href^="/browse?t="]')) {
							category = $.trim($('table#detailstable a[href^="/browse?t="]').text().match(/^\s*([^< -]+)/)[1]);
						}
						addToSABnzbd(
							this,
							$(this).attr('href') + queryString,
							'addurl',
							null,
							category
						);
						return false;
					})
				;
			});
		}

		if ($('[value="Send to SABnzbd"]').length == 0) {
			// List view: add a button above the list to send selected NZBs to SAB
			$('input.nzb_multi_operations_cart')
				.after(' <input type="button" class="btn btn-info btn-mini multiDownload" value="Send to SABnzbd" />')
				.siblings('input.multiDownload')
				.on('click', {selector: 'td input:checked'}, addMany)
			;
		}

		// Cart page: add a button above the list to send all NZBs to SAB
		if ($('#main h1').text() === 'My Cart' || $('.container h1').text() === 'My Cart') {
			$('.nzb_multi_operations')
				.append('<input type="button" value="Send Cart to SABnzbd" class="btn btn-info btn-mini cartDownload" />')
				.find('input.cartDownload')
				.on('click', {selector: 'tr:gt(0)'}, addMany)
			;
		}
		
		// Fallback: Try to find download links more broadly if no icons were added
		if ($('a.addSABnzbd').length == 0 && $('a.addSABnzbdDetails').length == 0) {
			console.log('SABconnect++ Newznab: No icons added with standard selectors. Trying fallback...');
			console.log('SABconnect++ Newznab: Current hostname:', window.location.hostname);
			console.log('SABconnect++ Newznab: Current URL:', window.location.href);
			console.log('SABconnect++ Newznab: Looking for links with selectors: a[href*="/getnzb/"], a[href*=".nzb"]');
			console.log('SABconnect++ Newznab: Found links:', $('a[href*="/getnzb/"], a[href*=".nzb"]').length);
			
			// Try multiple selector patterns common to different Newznab sites
			var selectorPatterns = [
				'a[href*="getnzb"], a[href*=".nzb"], a#downloadlink',  // Standard patterns
				'a[href*="/download/"], a[href*="get="]',  // Alternative patterns
				'a[href*="/api"][href*="t=get"]',  // API-based downloads
				'a[title*="Download"], a[title*="Get NZB"]',  // Title-based
				'a[href*="/nzb/"], a[href*="nzb="]',  // NZB parameter patterns
				'a[href*="download"][href*="nzb"]'  // Generic download+nzb pattern
			];
			
			var addedCount = 0;
			
			// Try each pattern until we find matching links
			for (var i = 0; i < selectorPatterns.length && addedCount === 0; i++) {
				var pattern = selectorPatterns[i];
				var foundLinks = $(pattern).length;
				console.log('SABconnect++ Newznab: Trying pattern', i + 1, ':', pattern, '- Found', foundLinks, 'links');
				
				if (foundLinks > 0) {
					addedCount = addIconsWithFallback({
						linkSelector: pattern,
						iconClass: 'addSABnzbd',
						clickHandler: function(e) {
							e.preventDefault();
							var originalUrl = $(this).attr('href');
							var finalUrl = queryString ? originalUrl + queryString : originalUrl;
							
							// For problematic sites like nzbstars.com, try downloading the file directly
							if (window.location.hostname.includes('nzbstars.com')) {
								e.preventDefault();
								e.stopPropagation();
								
								fetch(originalUrl)
									.then(response => {
										if (!response.ok) {
											throw new Error(`HTTP error! status: ${response.status}`);
										}
										
										const responseHeaders = response.headers;
										return response.text().then(text => ({ text, responseHeaders }));
									})
									.then(({ text, responseHeaders }) => {
										// Validate that this is actually an NZB file
										if (!text.includes('<?xml') && !text.includes('<nzb')) {
											throw new Error('Downloaded content is not a valid NZB file');
										}
										
										if (text.includes('<html') || text.includes('<HTML')) {
											throw new Error('Downloaded content is an HTML page, not an NZB file');
										}
										
										// Extract filename from various sources
										let nzbFilename = 'download.nzb';
										
										// Try to get filename from Content-Disposition header
										const contentDisposition = responseHeaders.get('content-disposition');
										if (contentDisposition) {
											const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
											if (filenameMatch && filenameMatch[1]) {
												nzbFilename = filenameMatch[1].replace(/['"]/g, '');
											}
										}
										
										// Try to extract from NZB XML content
										if (nzbFilename === 'download.nzb') {
											const fileMatch = text.match(/<file[^>]*subject="([^"]*)"[^>]*>/);
											if (fileMatch && fileMatch[1]) {
												nzbFilename = fileMatch[1]
													.replace(/[<>:"/\\|?*]/g, '_')
													.replace(/^Re:\s*/i, '')
													.substring(0, 100)
													.trim();
												if (!nzbFilename.endsWith('.nzb')) {
													nzbFilename += '.nzb';
												}
											}
										}
										
										// Fallback: try to extract from URL (for nzbstars.com messageid)
										if (nzbFilename === 'download.nzb') {
											const urlParams = new URLSearchParams(originalUrl.split('?')[1]);
											const messageId = urlParams.get('messageid');
											if (messageId) {
												nzbFilename = `nzbstars_${messageId.replace(/[<>:"/\\|?*@]/g, '_')}.nzb`;
											}
										}
										
										// Convert to blob for upload
										const blob = new Blob([text], { type: 'application/x-nzb' });
										
										// Convert blob to base64 for transmission to service worker
										const reader = new FileReader();
										reader.onload = function() {
											const base64data = reader.result.split(',')[1];
											
											// Send the NZB file data to service worker
											chrome.runtime.sendMessage({
												action: 'uploadNZBFile',
												fileData: base64data,
												filename: nzbFilename
											});
										};
										reader.readAsDataURL(blob);
									})
									.catch(error => {
										// Fallback to regular approach
										var $row = $(this).closest('tr');
										if ($row.length > 0) {
											addOne($row);
										} else {
											addToSABnzbd(this, finalUrl, 'addurl', null, null);
										}
									});
								return false;
							}
							
							var $row = $(this).closest('tr');
							if ($row.length > 0) {
								addOne($row);
							} else {
								// If not in a table row, handle differently
								addToSABnzbd(
									this,
									finalUrl,
									'addurl',
									null,
									null
								);
							}
							return false;
						}
					});
					
					if (addedCount > 0) {
						console.log('SABconnect++ Newznab: Successfully added', addedCount, 'icons using pattern:', pattern);
						break;
					}
				}
			}
			
			// Debug info only if still no icons
			if (addedCount === 0) {
				console.log('SABconnect++ Newznab: Debug info - still no icons added:');
				console.log('SABconnect++ Newznab: All tables:', $('table').length);
				console.log('SABconnect++ Newznab: All links with .nzb in href:', $('a[href*=".nzb"]').length);
				console.log('SABconnect++ Newznab: All links with /getnzb/ in href:', $('a[href*="/getnzb/"]').length);
				
				// Sample some links to understand the site structure
				console.log('SABconnect++ Newznab: Sample links on page:');
				$('a').slice(0, 20).each(function(index, element) {
					var href = $(element).attr('href');
					var title = $(element).attr('title');
					var text = $(element).text().trim();
					if (href && (href.indexOf('download') !== -1 || href.indexOf('nzb') !== -1 || href.indexOf('get') !== -1)) {
						console.log('SABconnect++ Newznab: Potential download link:', { href: href, title: title, text: text });
					}
				});
			}
			
			console.log('SABconnect++ Newznab: FINAL - Total SAB icons added:', $('a.addSABnzbd').length);
		} else {
			console.log('SABconnect++ Newznab: Successfully added icons:', $('a.addSABnzbd').length);
		}
	});

})();
