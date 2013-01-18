var store = new StoreClass('sabsettings', {}, undefined, storeReady_popup);

function storeReady_popup() {
	var nowtime = new Date();
	var lastOpened = parseInt(getPref("lastOpened"));
	var closeWindow = false;
	if (lastOpened > 0) {
		if (nowtime.getTime() - lastOpened < 700) { 
			chrome.tabs.create({url: activeProfile().url});
			closeWindow = true;
			window.close();
		}
	}
	if (!closeWindow) {
		setPref("lastOpened", nowtime.getTime());
		SetupTogglePause();
		reDrawPopup();
	}

	$('#open_sabnzbd').click( function() {
		var profile = activeProfile();
		var url = $.url.parse( profile.url );
		
		var build = {
			protocol: url.protocol,
			host: url.host,
			port: url.port,
			path: url.path,
		}
		
		if( store.get( 'config_enable_automatic_authentication' ) ) {
			build.user = profile.username;
			build.password = profile.password;
		}
		
		var test = $.url.build( build );
		
		chrome.tabs.create( { url: $.url.build( build ) } );
	});

	$('#extension_settings').click( function() {
		chrome.tabs.create({url: 'settings.html'});
	});

	$('#refresh').click( function() {
		refresh();
	});

	$('#set-speed').click( function() {
		setMaxSpeed( $('#speed-input').val() );
	});

	$('#speed-input').keydown( function( event ) {
		var code = event.keyCode || event.which;
		if( code == 13 ) { // Enter pressed
			setMaxSpeed( $('#speed-input').val() );
		}
	});

	populateProfileList();

	$('#profiles').val( profiles.getActiveProfile().name );
	$('#profiles').change( OnProfileChanged );

	if (store.get('config_use_user_categories')) {
		$('#user_category').css("display", "block");
		populateAndSetCategoryList();
	}

	setMaxSpeedText();
}

function refresh()
{
	var background = chrome.extension.getBackgroundPage();
	background.refresh();
}

function setMaxSpeedText()
{
	getMaxSpeed( function( data ) {
		$('#speed-input').val( data ? data.speedlimit : '' );
	});
}

/// @param speed Maximum speed in KBps
function setMaxSpeed( speed )
{
	var background = chrome.extension.getBackgroundPage();
	background.setMaxSpeed( speed,
		// Success
		function() {
			setMaxSpeedText();
		},
		// Failure
		function( XMLHttpRequest, textStatus, errorThrown ) {
			alert( 'Failed to set max speed.' );
		}
	);
}

function getMaxSpeed( success_callback )
{
	var background = chrome.extension.getBackgroundPage();
	background.getMaxSpeed( success_callback );
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
		username: activeProfile().username,
		password: activeProfile().password,
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
		username: activeProfile().username,
		password: activeProfile().password,
		success: function(data) { refresh() },
		error: function() {
			$('#error').html('Failed to move item, please check your connection to SABnzbd');
		}
	});
}

var paused = false;
var oldPos = -1;

function durationPause(e) {
	var val = parseInt($(this).val());
	if(isNaN(val)) {
		val = parseInt(window.prompt("Duration (minutes)"));
	}
	if(val > 0) {
		togglePause(val);
	} else {
		$(this).val(0);
	}
}

function togglePause(duration) {	
	if (paused) {
		var mode = 'resume';
		var wasPaused = true;
	} else {
		var mode = 'pause';
		var wasPaused = false;
	}
	
	var sabApiUrl = constructApiUrl();
	var data = constructApiPost();
	
	data.mode = mode;
	if(mode == "pause" && typeof duration == "number") {
		data.mode = "config";
		data.name = "set_pause";
		data.value = duration;
	}
	
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
			$('#togglePause').replaceWith(buildPauseDiv(msg, !wasPaused));
			
			refresh();
		},
		error: function() {
			$('#togglePause').html('failed - try again');
		}
	});	
}

function SetupTogglePause() {
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
	
	$(".menu").prepend("<hr>", buildPauseDiv(msg));
	
	$(".menu").on("click", "select", function(e) { e.stopPropagation(); });
	$(".menu").on("change", "#pause-duration", durationPause);
	$(".menu").on("click", "#togglePause", togglePause);
}

function buildPauseDiv(msg, overridePaused) {
	var pauseState = overridePaused;
	if(typeof pauseState == "undefined") {
		pauseState = getPref('paused');
	}
	var $div = $("<div id='togglePause'><span style='float:none;'>"+ msg +" </span></div");
	
	if(!pauseState) {
		var selectDuration = $("<select id='pause-duration'></select>");
		var durations = {
			0:		"&#8734;",
			5:		"5 minutes",
			15:		"15 minutes",
			30:		"30 minutes",
			60: 	"1 hour",
			180:	"3 hours",
			360:	"6 hours",
			NaN:	"Other..."
		}
		for(var minutes in durations) {
			var intMinutes = parseInt(minutes);
			selectDuration.append($("<option value='"+ intMinutes +"'>"+durations[minutes]+"</option>"));
		}
		
		$div.append(selectDuration);
	}
	
	return $div;
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
	});
	
	var status = getPref('status');
	$('#sab-status').removeClass().addClass(status);
	
	if(paused) {
		var remaining = getPref("pause_int");
		if(remaining == 0) { //"0"
			$("#sab-timeleft").html("&#8734;");
		} else {
			$("#sab-timeleft").html(remaining);
		}
	}
	
	var data = {
		'playImg':chrome.extension.getURL('images/control_play.png'),
		'pauseImg':chrome.extension.getURL('images/control_pause.png'),
		'deleteImg':chrome.extension.getURL('images/messagebox_critical.png')
	};
	
	// Grab a list of jobs (array of slot objects from the json API)
	var queue = getPref("queue");
	var jobs = [];
	if(typeof queue != "undefined")
		jobs = JSON.parse(getPref('queue'));
	$.each(jobs, function(i, slot) {
	    // Replaced jqote, which doesn't work in Chrome extensions, when using manifest v2.
		var el = '<li id="' + slot.nzo_id + '" class="item">'
		    + '<div class="file-' + slot.status + ' filename">' + slot.filename + '</div>'
		    + '<div class="controls">';
		if ( slot.status == "Paused" ) {
		    el += '<a class="resumeItem lowOpacity" href=""><img src="' + data.playImg + '" /></a>';
	    } else {
		    el += '<a class="pauseItem lowOpacity" href=""><img src="' + data.pauseImg + '" /></a>';
	    }
	    el += '<a class="deleteItem lowOpacity" href=""><img src="' + data.deleteImg + '" /></a>'
        	+ '</div>'
        	+ '<div class="float-fix"></div>';
        if (slot.percentage != "0") {
            el += '<div class="progressBarContainer"><div class="progressBarInner" style="width:' + slot.percentage + '%"></div></div>';
        }
        el += '</li>';

		$(el).appendTo($('#sab-queue'));
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
		var speedlog = getPref('speedlog');
		var line1 = [0];
		if(typeof speedlog != "undefined") {
			line1 = JSON.parse(speedlog);
		}
		if (line1.sum() == 0 || status == 'Idle') {
		    $('#graph').hide();
		} else {
		    $('#graph').html('');
		    $('#graph').show();
		    $('body').css({height: 'none'});
		    $('html').css({height: 'none'});
    		var plot1 = $.jqplot('graph', [line1], {
    		    seriesColors: ['#696'],
                axes: {yaxis: {min: 0}, xaxis: {min: 1, max: 10, numberTicks: 5, tickOptions: {showLabel: false}}},
                seriesDefaults: { 
                    fill: true,
                    fillAndStroke: true,
                    fillColor: '#ADA',
                    showMarker: false,
                    pointLabels: { show: false } 
                },
                grid: {
                    drawGridLines: false,
                    gridLineColor: '#FFF',
                    shadow: false,
                    background: '#FFF',
                    borderWidth: 0.2
                }
            });
		}
	} else {
	    // Graph is disabled
	    $('#graph').hide();
	}
    var newHeight = $('#sabInfo').height() + $('.menu').height() + 28;
    $('body').css({height: newHeight+'px'});
    $('html').css({height: newHeight+'px'});
}

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
}

function OnProfileChanged( event )
{
	var profileName = event.target.value;
	profiles.setActiveProfile( profileName );
	
	var tabs = chrome.extension.getViews( {type: 'tab'} );
	for( var t in tabs ) {
		var tab = tabs[t];
		if( tab.is_sabconnect_settings ) {
			tab.changeActiveProfile( profileName );
		}
	}
	
	setMaxSpeedText();
	refresh();
}

function populateProfileList()
{
	var profiles = store.get( 'profiles' );
	for( var p in profiles ) {
		$('#profiles').append(
            $('<option>').attr({
    			value: p,
    			text: p
    		}).html(p)
		);
	}
}

function OnCategoryChanged(event)
{
    var categoryName = event.target.value;
    store.set('active_category', categoryName);

    setMaxSpeedText();
    refresh();
}

function populateAndSetCategoryList()
{
    var params = {
        action: 'get_categories'
    }
    chrome.extension.sendMessage(params, function(data) {
        for (i = 0; i < data.categories.length; i++) {
            var cat = '<option value="' + data.categories[i] + '">' + data.categories[i] + '</option>';
            $('#userCategory').append(cat);
        }
        $('#userCategory').val(store.get('active_category'));
        $('#userCategory').change(OnCategoryChanged);
    });
}
