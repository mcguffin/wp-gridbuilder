<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-ui-toolbar">
		<div class="toolbar-row">
			<div class="toolbar-left">
				<div class="btn-group add">
					<!-- container -->
					<button data-add-item="container" class="add-item add-container btn small button-secondary"><?php _e('Add Container','wp-gridbuilder') ?></button>
					<select data-add-item="container" class="add-item add-container btn small">
						<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
					</select>
					<!-- container -->
					<button data-add-item="row" class="add-item add-row btn small button-secondary"><?php _e('Add Row','wp-gridbuilder') ?></button>
					<select data-add-item="row" class="add-item add-row btn small">
						<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
					</select>
					<button data-add-item="cell" class="add-item add-cell btn small button-secondary"><?php _e('Add Cell','wp-gridbuilder') ?></button>
					<select data-add-item="cell" class="add-item add-cell btn small">
						<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
					</select>
					<button data-add-item="widget" class="add-item add-widget btn small button-secondary"><?php _e('Add Widget','wp-gridbuilder') ?></button>
					<select data-add-item="widget" class="add-item add-widget btn small">
						<option value=""><?php _e( '▼', 'wp-gridbuilder' ) ?></option>
					</select>
				</div>
			</div>
			<?php if ( current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ) ) { ?>
			<div class="toolbar-right">
				<div class="btn-group add">
					<button class="create-template btn small button-secondary"><?php _e( 'Create Template', 'wp-gridbuilder' ); ?></button>
					<button class="update-template btn small button-secondary"><?php _e( 'Update Template', 'wp-gridbuilder' ); ?></button>
					<button class="manage-templates btn small button-secondary"><?php _e( 'Manage Templates', 'wp-gridbuilder' ); ?></button>
				</div>
			</div>
			<?php } ?>
		</div>
		<hr />
		<div class="toolbar-row">
			<div class="btn-group viewswitcher toolbar-left"></div>
			<div class="btn-group set-visibility toolbar-center item-action">
				<?php _e( 'Visibility:', 'wp-gridbuilder' ) ?>

				<input disabled="disabled" type="radio" value="" name="set-visibility" id="sogrid-visibility-none" />
				<label for="sogrid-visibility-none"><?php _e( 'Default', 'wp-gridbuilder' ) ?></label>

				<input disabled="disabled" type="radio" value="visible" name="set-visibility" id="sogrid-visibility-visible" />
				<label for="sogrid-visibility-visible"><?php _e( 'Visible', 'wp-gridbuilder' ) ?></label>

				<input disabled="disabled" type="radio" value="hidden" name="set-visibility" id="sogrid-visibility-hidden" />
				<label for="sogrid-visibility-hidden"><?php _e( 'Hidden', 'wp-gridbuilder' ) ?></label>
			</div>
			<div class="toolbar-right">
				<button disabled="disabled" class="item-action btn small edit button-primary"><?php _e('Edit','wp-gridbuilder') ?></button>
				<button disabled="disabled" class="item-action btn small clone button-secondary"><?php _e('Clone','wp-gridbuilder') ?></button>
				<button disabled="disabled" class="item-action btn small delete red button-secondary"><?php _e('Delete','wp-gridbuilder') ?></button>
				<?php if ( current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ) ) { ?>
					<input disabled="disabled" class="item-action lock" type="checkbox" id="element-lock" />
					<label for="element-lock" class="btn small lock button-secondary">
						<span class="dashicons dashicons-unlock"></span>
					</button>
				<?php } ?>
			</div>
		</div>
	</script>