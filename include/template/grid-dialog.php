<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-edit-dialog">
		<h2 class="grid-dialog-title"></h2>
		<div class="grid-dialog-content">
		</div>
		<div class="grid-dialog-sidebar">
		</div>
		<div class="grid-dialog-toolbar"></div>
	</script>

	<script type="text/html" id="tmpl-grid-manage-templates-dialog">
		<h2 class="grid-dialog-title"></h2>
		<div class="grid-dialog-content"></div>
		<div class="grid-dialog-toolbar"></div>
	</script>

	<script type="text/html" id="tmpl-grid-prompt">
		<div class="grid-promt-dialog-wrap">
			<div class="grid-promt-dialog-inner">
				<div class="grid-promt-dialog">
					<# console.log(data);if ( !! data.title ) {   #><div class="grid-prompt-title"><h2>{{{ data.title }}}</h2></div><# } #>
					<div class="grid-prompt-value">
						<input type="text" class="widefat" value="{{{ data.defaultValue }}}" />
					</div>
					<# if ( !! data.message ) { #><div class="grid-prompt-message"><p class="description">{{{ data.message }}}</p></div><# } #>
					<div class="grid-prompt-toolbar">
						<button class="btn-cancel button-secondary"><?php _e('Cancel','wp-gridbuilder'); ?></button>
						<button class="btn-confirm button-primary"><?php _e('Okay','wp-gridbuilder'); ?></button>
					</div>
				</div>
			</div>
		</div>
		<div class="media-modal-backdrop"></div>
	</script>


	<script type="text/html" id="tmpl-grid-templates-list">
		<h2>{{{ data.title }}}</h2>
		<ul class="templates"></ul>
	</script>



