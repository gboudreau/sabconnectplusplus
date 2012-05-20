
var rssUrl = $('link[type="application/rss+xml"]').attr('href'),
	queryString = '?i=' + rssUrl.match(/i=(\d+)/)[1] + '&r=' + rssUrl.match(/r=(\w+)/)[1];

Initialize('nzbs', null, function() {

	// List view: Loop through each download link and add a one click link next the title
	$('#browsetable tr:gt(0)').each(function() {
	
		var $tr = $(this),
			img = chrome.extension.getURL('/images/sab2_16.png'),			
			href = $tr.find('.icon_nzb a').attr('href'),
			link = '<a style="margin-right: 3px; position: relative; top: 3px;" class="addSABnzbd" href="' + href + '"><img src="' + img + '" /></a>';
			
		$tr.find('td.item label').prepend(link);
		
		$tr.find('a.addSABnzbd')
			.on('click', function() {
				addNzbFromTr($(this).closest('tr'));
				return false;
			})
		;
	});

	// Details view: Find the download button, and prepend a sabnzbd button
	$('table.details tr:last td:nth-child(2)').each(function() {
	
		var $this = $(this),
			img = chrome.extension.getURL('/images/sab2_16.png'),
			href = 	$this.find('.icon_nzb a').attr('href'),
			link = '<div class="icon"><a class="addSABnzbdDetails" href="' + href + '"><img src="' + img + '" /></a></div>';
			
		$this
			.prepend(link)
			.find('a.addSABnzbdDetails')
			.on('click', function() {
				addNzbParametersAndDownload(
					this,
					$(this).attr('href'),
					$('table.details tr:nth-child(2) td:nth-child(2) a').text().match(/^([^-]+)/)[1]
				)
			;
			return false;
		});
	});
	
	// List view: add a button above the list to send selected NZBs to SAB
	$('input.nzb_multi_operations_cart').each(function() {
	
		var $this = $(this),
			button = '<input type="button" value="Send to SABnzbd" class="submit multiDownload" />';
			
		$this.after(button);
		
		$this
			.parent()
			.find('input.multiDownload')
			.on('click', {selector: 'input:checked'}, addMultipleToSABnzbdFromNZBORG)
		;
	});
	
	// Cart page	
	if ($('#main h1').text() === 'My Cart') {
	
		$('.nzb_multi_operations')
			.prepend('<input type="button" value="Send Cart to SABnzbd" class="submit cartDownload" />')
			.find('input.cartDownload')
			.on('click', {selector: 'tr:gt(0)'}, addMultipleToSABnzbdFromNZBORG)
		;
	}
});

function addMultipleToSABnzbdFromNZBORG(e) {

	var $this = $(this);

	$this.val("Sending...").css('color', 'orange');	
	
	$('#browsetable ' + e.data.selector).each(function() {
		addNzbFromTr($(this).closest('tr'));
	});

	$this.val('Sent to SABnzbd!').css('color', 'green');

	setTimeout(function(){
		$this.val('Send to SABnzbd').css('color', '#888');
	}, 4000);

	return false;
}

function addNzbFromTr($tr) {

	var $a = $tr.find('a.addSABnzbd');
	
	addNzbParametersAndDownload(
		$a.get(0),
		$a.attr('href'),
		$tr.find('td:nth-child(3) a').text().match(/^([^-]+)/)[1]
	);
}

// http://nzbs.org/getnzb/abef39dde2baaad865adecb95e5eb26d
function addNzbParametersAndDownload(addLink, nzburl, category) {

	addToSABnzbd(addLink, 'https://nzbs.org'+nzburl+queryString, "addurl", null, category);
}