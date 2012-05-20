
(function() { // Encapsulate

	var rssUrl = $('link[type="application/rss+xml"]').attr('href'),
		queryString = '?i=' + rssUrl.match(/i=(\d+)/)[1] + '&r=' + rssUrl.match(/r=(\w+)/)[1],
		oneClickImgTag = '<img src="' + chrome.extension.getURL('/images/sab2_16.png') + '" />';	
	
	function addMany(e) {
	
		var $button = $(this);
	
		$button.val("Sending...").css('color', 'orange');	
		
		$('#browsetable ' + e.data.selector).each(function() {
			addOne($(this).closest('tr'));
		});
	
		$button.val('Sent to SABnzbd!').css('color', 'green');
	
		setTimeout(function(){
			$button.val('Send to SABnzbd').css('color', '#888');
		}, 4000);
	
		return false;
	}
	
	// $tr is a table row from #browsetable (one nzb)
	// http://nzbs.org/getnzb/abef39dde2baaad865adecb95e5eb26d
	function addOne($tr) { 
	
		var $anchor = $tr.find('a.addSABnzbd');
		
		addToSABnzbd(
			$anchor.get(0),
			'https://nzbs.org'+$anchor.attr('href')+queryString,
			"addurl",
			null, 
			$tr.find('td:nth-child(3) a').text().match(/^([^-]+)/)[1]
		);
	}
		
	Initialize('nzbs', null, function() {

		// List view: Loop through each #browsetable row and add a one click link next the title
		$('#browsetable tr:gt(0)').each(function() {
		
			var $tr = $(this),
				href = $tr.find('.icon_nzb a').attr('href'),
				link = '<a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a>';
				
			$tr.find('td.item label').prepend(link);
			
			$tr.find('a.addSABnzbd')
				.on('click', function() {
					addOne($(this).closest('tr'));
					return false;
				})
			;
		});
	
		// Details view: Find the download buttons, and prepend a sabnzbd button
		$('table.details tr:last td:nth-child(2)').each(function() {
		
			var $tdWithButtons = $(this),
				href = 	$tdWithButtons.find('.icon_nzb a').attr('href'),
				oneClickButton = '<div class="icon"><a class="addSABnzbdDetails" href="' + href + '">' + oneClickImgTag + '</a></div>';

			$('#infohead').append(oneClickButton);

			$tdWithButtons.prepend(oneClickButton)
				.find('a.addSABnzbdDetails')
				.add('#infohead .addSABnzbdDetails')
				.on('click', function() {
					addToSABnzbd(
						this,
						'https://nzbs.org'+$(this).attr('href')+queryString,
						"addurl",
						null, 
						$('table.details tr:nth-child(2) td:nth-child(2) a').text().match(/^([^-]+)/)[1]
					);
					return false;
				})
			;
		});
		
		
		// List view: add a button above the list to send selected NZBs to SAB
		$('input.nzb_multi_operations_cart').each(function() {
		
			$(this).after('<input type="button" value="Send to SABnzbd" class="multiDownload" />')
				.siblings('input.multiDownload')
				.on('click', {selector: 'input:checked'}, addMany)
			;
		});
		
		// Cart page: add a button above the list to send all NZBs to SAB
		if ($('#main h1').text() === 'My Cart') {
		
			$('.nzb_multi_operations')
				.prepend('<input type="button" value="Send Cart to SABnzbd" class="cartDownload" />')
				.find('input.cartDownload')
				.on('click', {selector: 'tr:gt(0)'}, addMany)
			;
		}
	});

})();