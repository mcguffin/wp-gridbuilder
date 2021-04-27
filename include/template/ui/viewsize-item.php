<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-viewsize-item">
		<input type="radio" value="{{{ data.size }}}" name="sogrid-view" id="sogrid-view-{{{ data.size }}}" />
		<label class="btn small button-secondary" for="sogrid-view-{{{ data.size }}}"><span class="{{{ data.icon }}}"><span class="screen-reader-text">{{{ data.name }}}</span></span></label>
	</script>
