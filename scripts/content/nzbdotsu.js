
(function() { // Encapsulate

	var queryString = '?i=' + $('[name=UID]').val() + '&r=' + $('[name=RSSTOKEN]').val() + '&del=1',
		oneClickImgTag = '<img style="vertical-align:top;" src="' + chrome.extension.getURL('/images/sab2_16.png') + '" />';

	var baseUrl = 'https://'+window.location.host;
	
	function addCart(e) {
	
		var $button = $(this);
	
		$button.val("Sending...").css('color', 'orange');	
		console.log(e.data.selector)
		$(e.data.selector).each(function() {
			addOneCart($(this).closest('tr'));
		});
		
		$button.val('Sent to SABnzbd!').css('color', '#0F0');
		
		setTimeout(function() {
			$button.val('Send to SABnzbd').css('color', '#FFF');
		}, 4000);
		
		return false;
	}
	
	// $tr is a table row (one nzb)
	function addOneCart($tr) { 
	
		var $anchor = $tr.find('a[title="View details"]');
		var href = $anchor.attr('href').replace("details","getnzb");
		var category = null;
		if ($.trim($tr.parent().find('tr:nth-child(1)').find('th:nth-child(2)').text().toLowerCase()) == 'category') {
		    category = $.trim($tr.find('td:nth-child(2) a').text().match(/^\s*([^> -]+)/)[1]);
		} else if ($.trim($tr.parent().find('tr:nth-child(1)').find('th:nth-child(3)').text().toLowerCase()) == 'category') {
		    category = $.trim($tr.find('td:nth-child(3) a').text().match(/^\s*([^> -]+)/)[1]);
		}
		
		addToSABnzbd(
			null,
			baseUrl + href + queryString,
			'addurl',
			null, 
			category
		);
	}
	
	function addMany(e) {
	
		var $button = $(this);
	
		$button.val("Sending...").css('color', 'orange');	
		console.log(e.data.selector)
		$(e.data.selector).each(function() {
			addOne($(this).closest('tr'));
		});
		
		$button.val('Sent to SABnzbd!').css('color', '#0F0');
		
		setTimeout(function() {
			$button.val('Send to SABnzbd').css('color', '#FFF');
		}, 4000);
		
		return false;
	}
	
	// $tr is a table row (one nzb)
	function addOne($tr) { 
	
		var $anchor = $tr.find('a.addSABnzbd');
		
		var category = null;
		if ($.trim($tr.parent().find('tr:nth-child(1)').find('th:nth-child(2)').text().toLowerCase()) == 'category') {
		    category = $.trim($tr.find('td:nth-child(2) a').text().match(/^\s*([^> -]+)/)[1]);
		} else if ($.trim($tr.parent().find('tr:nth-child(1)').find('th:nth-child(3)').text().toLowerCase()) == 'category') {
		    category = $.trim($tr.find('td:nth-child(3) a').text().match(/^\s*([^> -]+)/)[1]);
		}
		
		addToSABnzbd(
			$anchor.get(0),
			baseUrl + $anchor.attr('href') + queryString,
			'addurl',
			null, 
			category
		);
	}
		
	Initialize('nzbdotsu', null, function() {
		
		// this handles all inline download buttons for single nzb files
		$('div.icon_nzb').each(function() {
		
			var  $tr = $(this),
				href = $(this).children("a").attr('href');
			
			$tr
				.before('<div class="icon"><a class="addSABnzbd" href="' + href + '">' + oneClickImgTag + '</a></div>')
			;
			
			$tr.parent().find('a.addSABnzbd')
				.on('click', function() {
					addOne($(this).closest('tr'));
					return false;
				})
			;
		});
		
		// List view: add a button above the list to send selected NZBs to SAB
		$('input.nzb_multi_operations_cart')
			.after('<input type="button" style="margin-left:5px" class="btn btn-mini btn-inverse disabled multiDownload" value="Send to SABnzbd" />')
			.siblings('input.multiDownload')
				.on('click', {selector: 'input.nzb_check:checked'}, addMany)
		;
		
		// Cart page: add a button above the list to send all NZBs to SAB
		if ($('div.span12 h1').text() === 'My Cart') {
		
			$('.nzb_multi_operations')
				.prepend('<input type="button" value="Send Cart to SABnzbd" class="btn btn-mini btn-primary cartDownload" />')
				.find('input.cartDownload')
				.on('click', {selector: 'tr:gt(0)'}, addCart)
			;
		}
	});

})();