$('document').ready(function() {
	// Set the current preference value based off the id
	$('.extension-preference').each(function() {
		var id = $(this).attr('id');
		$(this).val(getPref(id));
	});

	// Record a change to the preference
	$('.extension-preference').change(function() {
		var id = $(this).attr('id');
		var val = $(this).val();
		setPref(id, val);
	});

	// Choose the selected number based on the data, or default to '*id*_default' if the value doesn't exist in our groupbox.
	$('.extension-preference-select-number').each(function() {
		var id = $(this).attr('id');
		
		if ($(this).children().filter('[value="' + getPref(id) + '"]').length == 0) {
			setPref(id, getPref(id + '_default'));
		}
		
		$(this).children().filter('[value="' + getPref(id) + '"]').attr('selected', true);
	});

	// Record changes in the select combobox.
	$('.extension-preference-select-number').change(function() {
		var val = $(this).children().filter('[selected=true]').attr('value');
		setPref($(this).attr('id'), val);
	});

	// Checkboxes need to be handled a little differently
	$('.extension-preference-checkbox').each(function() {
		var id = $(this).attr('id');
		$(this).attr('checked', (getPref(id) == 1) ? 'checked' : '');
	});

	// Record a change to the preference
	$('.extension-preference-checkbox').change(function() {
		var id = $(this).attr('id');
		if ($(this).attr('checked')) {
			var val = 1;
		} else {
			var val = 0;
		}
		setPref(id, val);
	});

	$('#testSabConnection').click(function() {
		$('#conResponse').html('Checking...').css('display', 'block').removeClass('checkError').removeClass('checkOk');
		// Call our api queue function, and tell it to execute checkForErrors once complete
		testConnection();
		return false;
	});
	 
	$('#enable_context_menu').click( function() {
		chrome.extension.getBackgroundPage().SetupContextMenu();
	});
});

function testConnection()
{
	var background = chrome.extension.getBackgroundPage()
	background.testConnection( checkForErrors );
}

function checkForErrors() {
    // Called after a request to SABnzbd's api has been tried, 'error' should be set if there was an error
    var error = getPref('error');
    if(error) {
        $('#conResponse').html('Error: ' + error).addClass('checkError');
    } else {
        $('#conResponse').html('Connected sucessfully!').addClass('checkOk');
    }

    // Unsetting error here as otherwise would appear in popup - could confuse the user
    // Could move this just so it is removed when connected successfully
    setPref('error', '');
}
