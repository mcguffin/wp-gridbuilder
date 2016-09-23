<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-ui-input-wrap">
		<# if ( data.settings.title ) {  #>
			<label class="input-title" for="input-{{{ data.settings.name }}}">{{{ data.settings.title }}}</label>
		<# } #>
		<# if ( data.settings.lock ) {  #>
		<div class="lock">
			<input id="lock-{{{ data.settings.name }}}" type="checkbox" name="{{{ data.settings.name }}}:locked" />
			<label for="lock-{{{ data.settings.name }}}" class="dashicons dashicons-unlock"></label>
		</div>
		<# } #>
		<div class="prop">
			<div class="input"></div>
			<# if ( data.settings.description ) {  #>
				<p class="description">{{{ data.settings.description }}}</p>
			<# } #>
		</div>
	</script>
