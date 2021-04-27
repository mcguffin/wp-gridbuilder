<?php

if ( ! defined('ABSPATH') ) 
	die();

?>

	<script type="text/html" id="tmpl-grid-ui-input-select">
		<select class="widefat" id="input-{{{ data.settings.name }}}" name="{{{ data.settings.name }}}">
		<# for ( var name in data.settings.options ) { #>
			<option value="{{{ name }}}">{{{ data.settings.options[name] }}}</option>
		<# } #>
		</select>
	</script>
