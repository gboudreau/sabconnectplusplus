$(function() {
	$('button').button();
	$('#tabs').tabs();
	
	$('.tab-content').removeClass( 'tab-content' ).addClass( 'tab-content' );
	
	for( var i = 0; i < 10; ++i ) {
		$('#list').append( $('#list-item').jqote() );
	}
	
	$('#list > li > div.progress-bar').progressbar({ value: 59 });
	
	$('#list').sortable().disableSelection();
	
	$('#list-container').mCustomScrollbar( 'vertical', 400, 'easeOutCirc', 1.05, 'fixed', 'yes', 'no', 5 );
});