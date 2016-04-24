<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-view">
		<div class="grid-toolbar affix">
			<div class="toolbar-row">
				<div class="toolbar-left">
					<div class="btn-group add">
						<!-- container -->
						<button class="add-container btn small button-secondary"><?php _e('Add Container','wp-gridbuilder') ?></button>
						<select class="add-container btn small button-secondary">
							<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
						</select>
						<!-- container -->
						<button class="add-row btn small button-secondary"><?php _e('Add Row','wp-gridbuilder') ?></button>
						<select class="add-row btn small button-secondary">
							<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
						</select>
						<button class="add-cell btn small button-secondary"><?php _e('Add Cell','wp-gridbuilder') ?></button>
						<select class="add-cell btn small button-secondary">
							<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
						</select>
						<button class="add-widget btn small button-secondary"><?php _e('Add Widget','wp-gridbuilder') ?></button>
						<select class="add-widget btn small button-secondary">
							<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
						</select>
					</div>
				</div>
				<div class="toolbar-right">
					<div class="btn-group add">
						<button class="create-template btn small button-secondary"><?php _e( 'Create Template', 'wp-gridbuilder' ); ?></button>
						<button class="update-template btn small button-secondary"><?php _e( 'Update Template', 'wp-gridbuilder' ); ?></button>
						<button class="manage-templates btn small button-secondary"><?php _e( 'Manage Templates', 'wp-gridbuilder' ); ?></button>
					</div>
				</div>
			</div>
			<hr />
			<div class="toolbar-row">
				<div class="btn-group viewswitcher toolbar-left"></div>
				<div class="btn-group set-visibility toolbar-center item-action hidden">
					<?php _e( 'Visibility:', 'wp-gridbuilder' ) ?>

					<input type="radio" value="" name="set-visibility" id="sogrid-visibility-none" />
					<label for="sogrid-visibility-none"><?php _e( 'Default', 'wp-gridbuilder' ) ?></label>

					<input type="radio" value="visible" name="set-visibility" id="sogrid-visibility-visible" />
					<label for="sogrid-visibility-visible"><?php _e( 'Visible', 'wp-gridbuilder' ) ?></label>

					<input type="radio" value="hidden" name="set-visibility" id="sogrid-visibility-hidden" />
					<label for="sogrid-visibility-hidden"><?php _e( 'Hidden', 'wp-gridbuilder' ) ?></label>
				</div>
				<div class="toolbar-right">
					<button disabled="disabled" class="item-action btn small edit button-primary"><?php _e('Edit','wp-gridbuilder') ?></button>
					<button disabled="disabled" class="item-action btn small clone button-secondary"><?php _e('Clone','wp-gridbuilder') ?></button>
					<button disabled="disabled" class="item-action btn small delete red button-secondary"><?php _e('Delete','wp-gridbuilder') ?></button>
				</div>
			</div>
		</div>
		<ul class="collection containers" data-sort-group="container"></ul>
	</script>

	<script type="text/html" id="tmpl-viewsize-item">
		<input type="radio" value="{{{ data.size }}}" name="sogrid-view" id="sogrid-view-{{{ data.size }}}" />
		<label class="btn small button-secondary" for="sogrid-view-{{{ data.size }}}"><span class="{{{ data.icon }}}"><span class="screen-reader-text">{{{ data.name }}}</span></span></label>
	</script>

	<script type="text/html" id="tmpl-grid-media-modal">
		<div class="media-modal wp-core-ui">
			<button type="button" class="button-link media-modal-prev"><span class="dashicons dashicons-arrow-left-alt2"><span class="screen-reader-text"><?php _e('Next'); ?></span></span></button>
			<button type="button" class="button-link media-modal-next"><span class="dashicons dashicons-arrow-right-alt2"><span class="screen-reader-text"><?php _e('Next'); ?></span></span></button>
			<button type="button" class="button-link media-modal-close"><span class="media-modal-icon"><span class="screen-reader-text"><?php _e('Close'); ?></span></span></button>
			<div class="media-modal-content"></div>
		</div>
		<div class="media-modal-backdrop"></div>
	</script>

