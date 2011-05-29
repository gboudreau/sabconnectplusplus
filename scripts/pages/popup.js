var store = new Store( 'settings' );

function refresh()
{
	var background = chrome.extension.getBackgroundPage();
	background.refresh();
}

function moveQueueItem(nzoid, pos)
{
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
	data.mode = 'switch';
	data.value = nzoid;
	data.value2 = pos;

	$.ajax({
		type: "POST",
		url: sabApiUrl,
		data: data,
		username: store.get('sabnzbd_username'),
		password: store.get('sabnzbd_password'),
		success: function(data) { refresh() },
		error: function() {
			$('#error').html('Failed to move item, please check your connection to SABnzbd');
		}
	});
}

function queueItemAction(action, nzoid, callback)
{
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
	data.mode = 'queue';
	data.name = action;
	data.value = nzoid;	

	$.ajax({
		type: "POST",
		url: sabApiUrl,
		data: data,
		username: store.get('sabnzbd_username'),
		password: store.get('sabnzbd_password'),
		success: function(data) { refresh() },
		error: function() {
			$('#error').html('Failed to move item, please check your connection to SABnzbd');
		}
	});
}

var paused = false;
var oldPos = -1;
var gPopupTimer;
var refreshRate = 0;

function restartTimer() {
	startTimer(); 
}

function startTimer()
{
	if (gPopupTimer) {
		clearInterval(gPopupTimer);
	}
	
	gPopupTimer = setInterval( reDrawPopup, getRefreshRate() );
}

function togglePause() {
	if (paused) {
		var mode = 'resume';
		var wasPaused = true;
	} else {
		var mode = 'pause';
		var wasPaused = false;
	}
	
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost(true);
	data.mode = mode;
	
	$.ajax({
		type: "GET",
		url: sabApiUrl,
		data: data,
		success: function(data) {
			if (wasPaused) {
				var msg = 'Pause Queue';
			} else {
				var msg = 'Resume Queue';
			}
			$('#togglePause').html(msg);
			
			refresh();
		},
		error: function() {
			$('#togglePause').html('failed - try again');
		}
	});	
}

function func1() {
	paused = getPref('paused');

	if (paused) {
		var playImg = chrome.extension.getURL('images/control_play.png');
		var img = '<img src="' + playImg +'" />';
		var msg = 'Resume Queue';
	} else {
		var pauseImg = chrome.extension.getURL('images/control_pause.png');
		var img = '<img src="' + pauseImg +'" />';
		var msg = 'Pause Queue';
	}
	$('.menu').prepend('<hr /><div id="togglePause">' + msg + '</div>');
	$('#togglePause').click(function() {
		togglePause();
	});

	// Main function of this html page
	// Add a load of html using javascript ie sabnzbd queue and details, errors, ect
	reDrawPopup();
	startTimer();
}

function getSortItemPos(id) {
	var list = $('ul#sab-queue').sortable('toArray');
	var pos = -1;
	
	$.each(list, function(i, item) {
		if(item == id) {
			pos = i;
		}
	});
	
	return pos;
}

function reDrawPopup() {
	// If we do not want to redraw (such as in the middle of a drag and drop event, then skip
	if(getPref('skip_redraw') == '1') return;

	var error = getPref('error');
	if(error) {
		$('#sab-errors').html('<div id="errors-container">' + error + '</div>');
	} else {
		// No errors, remove anything that could have been here
		// If the refresh rate is too low, will cause no errors to be ever seen
		$('#sab-errors').html('');
	}

	// Make sure the current queue is clear
	$('ul#sab-queue').html('');

	paused = getPref('paused');

	var fields = ['status', 'paused', 'timeleft', 'speed', 'sizeleft', 'paused_jobs'];
	
	$.each(fields, function(i, field) {
		var value = getPref(field);
		$('#sab-' + field).html(value);
		$('#sab-' + field).html(value);
	});
	
	var status = getPref('status');
	$('#sab-status').removeClass().addClass(status);
	
	var data = {
		'playImg':chrome.extension.getURL('images/control_play.png'),
		'pauseImg':chrome.extension.getURL('images/control_pause.png'),
		'deleteImg':chrome.extension.getURL('images/messagebox_critical.png')
	};
	
	// Grab a list of jobs (array of slot objects from the json API)
	var jobs = JSON.parse(getPref('queue'));
	$.each(jobs, function(i, slot) {
		data['slot'] = slot;
		$('#template').jqote(data).appendTo($('#sab-queue'));
	});
	
	// The controls are low transparency until the user hovers over the parent item
	$(".item").hover(
		function () {
			// Restore opacity to full
			$(this).find('.lowOpacity').addClass('fullOpacity').removeClass('lowOpacity');
		}, 
		function () {
			// Set opacity to 20%
			$(this).find('.fullOpacity').addClass('lowOpacity').removeClass('fullOpacity');
		}
	);
	/*
	// The controls are low transparency until the user hovers over the parent item
	$(".filename").hover(
		function () {
			// Restore opacity to full
			$(this).closest('li').addClass('highlight')
		}, 
		function () {
			// Set opacity to 20%
			$(this).closest('li').removeClass('highlight')
		}
	);   */ 
	// The controls are low transparency until the user hovers over the parent item
	$(".item").hover(
		function () {
			// Restore opacity to full
			$(this).addClass('highlight');
		}, 
		function () {
			// Set opacity to 20%
			$(this).removeClass('highlight');
		}
	);
	
	// Make the ul sortable (only in the y axis)
	$("ul#sab-queue").sortable({ axis: 'y' });
	$("ul#sab-queue").disableSelection();
	
	// Cache the position when we start sorting
	$('ul#sab-queue').bind('sortstart', function(event, ui) {
		// Skip queue redrawing for the duration of the sort
		setPref('skip_redraw', 1);
		var id = $(ui.item).attr('id');
		oldPos = getSortItemPos(id);
	});
	
	// When the sorting has finished, do a SABnzbd api call
	$('ul#sab-queue').bind('sortstop', function(event, ui) {
		setPref('skip_redraw', 0);
		var id = $(ui.item).attr('id');
		var pos = getSortItemPos(id);
		// Make sure it has actually moved position
		if(pos == oldPos) return;
		// Position has moved, send off a SABnzbd api call
		moveQueueItem(id, pos);
	});
	
	// Do these need to be .live()?
	$('.resumeItem').click(function() {
		var id = $(this).closest('li.item').attr('id');
		queueItemAction('resume', id, reDrawPopup);
		
		return false;
	});
	
	$('.pauseItem').click(function() {
		var id = $(this).closest('li.item').attr('id');
		queueItemAction('pause', id, reDrawPopup);
		
		return false;
	});	
	
	$('.deleteItem').click(function() {
		var li = $(this).closest('li.item');
		var id = li.attr('id');
		// Delete the li element (mainly for user feedback). If they choose to open the popup again
		// before the delete and redraw have taken place the item will show. Really needs removing from 'queue' object (preference)
		li.remove();
		queueItemAction('delete', id, reDrawPopup);
		
		return false;
	});
	
	if( store.get( 'config_enable_graph' ) == '1' ) {
		var api = new jGCharts.Api();
		var url = api.make({
			data : JSON.parse(getPref('speedlog')), //MANDATORY
			type : 'lc',
			fillarea : true, //default false
			fillbottom : true, //default false
			size : '220x75'
		})
		
		// Let the image load first so as to not make it flicker.
		var graph = new Image();
		graph.src = url;
		graph.onload = function() {
			$('#graph').html('').append($('<div id="graph-inner"></div>').append(this));
		};
	}
}

$(document).ready( function() {
	$('#open_sabnzbd').click( function() {
		chrome.tabs.create( { url: store.get( 'sabnzbd_url' ) } );
	});

	$('#extension_settings').click( function() {
		chrome.tabs.create({url: 'settings.html'});
	});

	$('#refresh').click( function() {
		refresh();
	});
});

var nowtime = new Date();
var lastOpened = parseInt(localStorage["lastOpened"]);
var closeWindow = false;
if (lastOpened > 0) {
	if (nowtime.getTime() - lastOpened < 700) { 
		chrome.tabs.create({url: store.get('sabnzbd_url')});
		closeWindow = true;
		window.close();
	}
}
if (!closeWindow) {
	localStorage["lastOpened"] = nowtime.getTime();
	window.onload = function() { reDrawPopup(); };
}