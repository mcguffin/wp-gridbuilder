<?php

if ( ! defined('ABSPATH') ) 
	die();

/*
text
color
number
image
video
select
checkbox

*/

?>
	<script type="text/html" id="tmpl-input-group">
		<h2>{{{ data.settings.title }}}</h2>
		<div class="inputs"></div>
	</script>

	<script type="text/html" id="tmpl-input-wrap">
		<label class="input-title" for="input-{{{ data.settings.name }}}">{{{ data.settings.title }}}</label>
		<div class="input"></div>
		<p class="description">{{{ data.settings.description }}}</p>
	</script>


	<script type="text/html" id="tmpl-input-text">
		<input class="widefat" id="input-{{{ data.settings.name }}}" type="text" name="{{{ data.settings.name }}}" />
	</script>

	<script type="text/html" id="tmpl-input-textarea">
		<textarea class="widefat code" id="input-{{{ data.settings.name }}}" type="text" name="{{{ data.settings.name }}}"></textarea>
	</script>

	<script type="text/html" id="tmpl-input-color">
		<input id="input-{{{ data.settings.name }}}" type="text" name="{{{ data.settings.name }}}" class="color-picker" />
	</script>

	<script type="text/html" id="tmpl-input-number">
		<input id="input-{{{ data.settings.name }}}" type="number" name="{{{ data.settings.name }}}" />
	</script>

	<script type="text/html" id="tmpl-input-range">
		<input id="input-{{{ data.settings.name }}}" type="range" name="{{{ data.settings.name }}}" 
			<# if ( data.settings.min ) { #>min="{{{ data.settings.min }}}"<# } #>
			<# if ( data.settings.max ) { #>max="{{{ data.settings.max }}}"<# } #>
			<# if ( data.settings.step ) { #>step="{{{ data.settings.step }}}"<# } #>
			/><span class="display-value"></span>
	</script>

	<script type="text/html" id="tmpl-input-select">
		<select class="widefat" id="input-{{{ data.settings.name }}}" name="{{{ data.settings.name }}}">
		<# for ( var name in data.settings.options ) { #>
			<option value="{{{ name }}}">{{{ data.settings.options[name] }}}</option>
		<# } #>
		</select>
	</script>

	<script type="text/html" id="tmpl-input-radio">
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

	<script type="text/html" id="tmpl-input-checkbox">
		<input id="input-{{{ data.settings.name }}}" type="checkbox" name="{{{ data.settings.name }}}" />
	</script>

	<script type="text/html" id="tmpl-input-media">
		<div class="preview image"></div>
		<button class="select-media button-secondary"><?php _e('Select Media','wp-gridbuilder') ?></button>
		<input type="hidden" name="media_id" />
		<div class="thumbnail"></div>
	</script>

