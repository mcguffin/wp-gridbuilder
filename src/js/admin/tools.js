(function($){

	$(document).on('change','[type="file"]',function() {
		var val = $(this).val().replace(/(.*)[\\\/]([^\\\/]+)$/g,'$2');
		$(this).next('.filename').text( val );
		$(this).closest('form').find('[type="submit"]').prop('disabled', !val );
	});

	$(document).on('change keyup focus blur','[name^="migrate-"]',function() {
		var val1 = $('[name="migrate-from"]').val(),
			val2 = $('[name="migrate-to"]').val();
		$(this).closest('form').find('[type="submit"]').prop('disabled', !val1 || !val2 );
	});

})(jQuery);
