(function($){

	$(document).on('change','[type="file"]',function() {
		var val = $(this).val().replace(/(.*)[\\\/]([^\\\/]+)$/g,'$2');
		$(this).next('.filename').text( val );
		$(this).closest('form').find('[type="submit"]').prop('disabled', !val );
	});
})(jQuery)