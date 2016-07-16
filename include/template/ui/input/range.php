<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-ui-input-range">
		<input id="input-{{{ data.settings.name }}}" type="range" name="{{{ data.settings.name }}}" 
			<# if ( data.settings.min ) { #>min="{{{ data.settings.min }}}"<# } #>
			<# if ( data.settings.max ) { #>max="{{{ data.settings.max }}}"<# } #>
			<# if ( data.settings.step ) { #>step="{{{ data.settings.step }}}"<# } #>
			/><span class="display-value"></span>
	</script>
