<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-ui-input-radio">
		<# for ( var name in data.settings.options ) { #>
			<span class="radiogroup">
				<input id="input-{{{ data.settings.name }}}-{{{ name }}}" type="radio" name="{{{ data.settings.name }}}" value="{{{ name }}}" />
				<label for="input-{{{ data.settings.name }}}-{{{ name }}}"><#
					if ( 'object' === typeof data.settings.options[name] ) {
						!!data.settings.options[name].name && print( data.settings.options[name].name );
						!!data.settings.options[name].description && print( '<small>' + data.settings.options[name].description + '</small>' );
					} else if ( 'string' === typeof data.settings.options[name] ) {
						print( data.settings.options[name] );
					}
				
				#></label>
			</span>
		<# } #>
	</script>
