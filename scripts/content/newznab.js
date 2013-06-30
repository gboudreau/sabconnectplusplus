
(function() { // Encapsulate

	var queryString = '?i=' + $('[name=UID]').val() + '&r=' + $('[name=RSSTOKEN]').val() + '&del=1',
		oneClickImgTag = '<img src="' + chrome.extension.getURL('/images/sab2_16.png') + '" />';
			
	function addMany(e) {
	
		var $button = $(this);
	
		$button.val("Sending...").css('color', 'orange');	
		
		$('#browsetable td ' + e.data.selector).each(function() {
			addOne($(this).closest('tr'));
		});
	
		$button.val('Sent to SABnzbd!').css('color', 'green');
	
		setTimeout(function() {
			$button.val('Send to SABnzbd').css('color', '#888');
		}, 4000);
	
		return false;
	}
	
	// $tr is a table row from #browsetable (one nzb)
	// http://nzbs.org/getnzb/abef39dde2baaad865adecb95e5eb26d
	function addOne($tr) { 
	
		var $anchor = $tr.find('a.addSABnzbd');

        // Set the image to an in-progress image
        var img = chrome.extension.getURL('images/sab2_16_fetching.png');
		if ($($anchor.get(0)).find('img').length > 0) {
			$($anchor.get(0)).find('img').attr("src", img);
		}
		
		var category = null;
		if ($.trim($tr.parent().find('tr:nth-child(1)').find('th:nth-child(2)').text().toLowerCase()) == 'category') {
		    category = $.trim($tr.find('td:nth-child(2) a').text().match(/^\s*([^> -]+)/)[1]);
		} else if ($.trim($tr.parent().find('tr:nth-child(1)').find('th:nth-child(3)').text().toLowerCase()) == 'category') {
		    category = $.trim($tr.find('td:nth-child(3) a').text().match(/^\s*([^> -]+)/)[1]);
		}
		
		addToSABnzbd(
			$anchor.get(0),
			$anchor.attr('href') + queryString,
			'addurl',
			null, 
			category
		);
	}
		
	Initialize('newznab', null, function() {
        
		// Cover view: Loop through each #coverstable and #browselongtable row and add a one click link next to the download link
		$.merge($('#coverstable > tbody > tr:gt(0)'), $('#browselongtable > tbody > tr:gt(0)')).each(function() {
			var $tr = $(this);

			$("div.icon_nzb", $tr).each(function() {
				var href = $("a", this).attr("href");
				$(this).before('<div class="icon"><a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a></div>')
			});
			
			$tr.find('a.addSABnzbd')
				.on('click', function() {
					addOne($(this).closest('tr'));
					return false;
				})
			;
		});

		// List view: Loop through each #browsetable row and add a one click link next to the title
		$('#browsetable tr:gt(0)').each(function() {
		
			var $tr = $(this),
				href = $tr.find('.icon_nzb a').attr('href');
				
			$tr.find('a[href^="/details/"]:not([href*="#"])').parent()
				.prepend('<a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a>')
			;
			
			$tr.find('a.addSABnzbd')
				.on('click', function() {
					addOne($(this).closest('tr'));
					return false;
				})
			;
		});
	
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
						$(this).attr('href')+queryString,
						'addurl',
						null, 
						category
					);
					return false;
				})
			;
		});
		
		// List view: add a button above the list to send selected NZBs to SAB
		$('input.nzb_multi_operations_cart')
			.after('<input type="button" value="Send to SABnzbd" class="multiDownload" />')
			.siblings('input.multiDownload')
			.on('click', {selector: 'input:checked'}, addMany)
		;
		
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