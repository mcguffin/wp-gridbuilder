<?php

namespace WPGridbuilder\Admin;
use WPGridbuilder\Core;

class Tools extends Core\Singleton {

	private $tool_page_name = 'gridbuilder-management';
	private $last_error = null;
	private $last_success_message = null;
	
	/**
	 * Private constructor
	 */
	protected function __construct() {
		add_action( 'admin_menu' , array( &$this , 'add_admin_page' ) );
	}

	/**
	 * 	Add Admin page to menu
	 *
	 *	@action	admin_menu
	 */
	function add_admin_page() {
		$page_hook = add_management_page( __( 'WP GridBuilder' , 'wp-gridbuilder' ), __( 'GridBuilder' , 'wp-gridbuilder' ), get_option( 'gridbuilder_manage_templates_capability' ), $this->tool_page_name, array( &$this , 'render_management_page' ) );
		add_action( "load-{$page_hook}" , array( &$this , 'enqueue_admin_page_assets' ) );
		add_action( "load-{$page_hook}" , array( &$this , 'handle_action' ) );
	}

	/**
	 * 	Show succes message
	 *
	 *	@action	admin_notices
	 */
	function admin_notices__success() {
		?><div class="notice notice-success is-dismissible">
    	    <p><?php 
    	    	if ( ! empty( $this->last_success_message ) ) {
    	    		echo $this->last_success_message;
    	    	} else {
	    	    	_e( 'Done!', 'wp-gridbuilder' ); 
	    	    }
	    	    ?></p>
	    </div><?php
	}

	/**
	 * 	Show error message
	 *
	 *	@action	admin_notices
	 */
	function admin_notices__error() {
		if ( is_wp_error( $this->last_error ) ) {
			?><div class="notice notice-error is-dismissible">
				<p><?php echo $this->last_error->get_error_message() ?></p>
			</div><?php
		}
	}


	/**
	 * 	Add Admin page to menu
	 *
	 *	@action	admin_menu
	 */
	function handle_action() {
		if ( isset( $_GET['page'] ) && $_GET['page'] === $this->tool_page_name && isset( $_POST['action'] ) ) {
			$action = $_POST['action'];
			$nonce = $_POST[ $action . '-nonce' ];
			$types = array( 'container', 'row', 'cell', 'widget' );
			if ( current_user_can( 'manage_options' ) && wp_verify_nonce( $nonce, $action ) ) {
				switch ( $action ) {
					case 'gridbuilder-migrate':
						global $wpdb;
						$old = $_POST['migrate-from'];
						$new = $_POST['migrate-to'];
						$sql = $wpdb->prepare( 
								"SELECT * FROM $wpdb->postmeta WHERE meta_key='_grid_data' AND meta_value LIKE '%%%s%%'", 
								$_POST['migrate-from'] 
							);
						$grid_postmeta = $wpdb->get_results( $sql );
						foreach ( $grid_postmeta as $meta ) {
							if ( $grid = unserialize( $meta->meta_value ) ) {
								$grid = $this->_replace_deep( $grid, $old, $new );
								update_post_meta( $meta->post_id, '_grid_data', $grid );
							}
						}
						$this->last_success_message = sprintf( _n( '%d Page updated', '%d Pages updated', count( $grid_postmeta ), 'wp-gridbuilder' ), count( $grid_postmeta ) );
						add_action( 'admin_notices', array( $this, 'admin_notices__success' ) );
						
						break;
					case 'gridbuilder-template-import':
						$templates_added = 0;
						$templates_updated = 0;
						$override = isset( $_POST[ 'gridbuilder-template-override' ] ) ? $_POST[ 'gridbuilder-template-override' ] : '';
						$upload = wp_handle_upload( $_FILES['gridbuilder-import-file'], array(
							'action'	=> $action,
							'test_type'	=> true,
							'mimes'		=> array( 'json' => 'application/json' ),
						) );
						$contents = file_get_contents( $upload['file'] );
						if ( ! empty( $contents ) ) {
							$template_data = json_decode( $contents, true );
							if ( is_array( $template_data ) && isset( $template_data['templates'] ) ) {
								foreach ( $types as $type ) {
									$option_name = "gridbuilder_{$type}_templates";
									if ( $override == 'delete' ) {
										$new_option = array();
									} else {
										$new_option = get_option( $option_name );
									}
									if ( isset( $template_data['templates'][ $type ] ) ) {
										foreach ( $template_data['templates'][ $type ] as $slug => $template ) {
											if ( ! isset( $new_option[ $slug ] ) || $override == 'update' ) {
												if ( isset( $new_option[ $slug ] ) ) {
													$templates_updated ++;
												} else {
													$templates_added ++;
												}
												$new_option[ $slug ] = $template;
											}
										}
									}
									update_option( $option_name, $new_option );
								}
								$msg = array();
//								var_dump($templates_added,$templates_added);
								if ( $templates_added ) {
									$msg[] = sprintf( _n( 'One template added.', '%d templates added.', $templates_added, 'wp-gridbuilder' ), $templates_added );
								}
								if ( $templates_updated ) {
									$msg[] = sprintf( _n( 'One template updated.', '%d templates updated.', $templates_updated, 'wp-gridbuilder' ), $templates_updated );
								}
								$this->last_success_message = implode( ' ', $msg );
							} else {
								// error
								$this->last_error = new \WP_Error( 'gridbuilder-import', __( 'Invalid import File', 'wp-gridbuilder' ) );
							}
						} else {
							// error
							$this->last_error = new \WP_Error( 'gridbuilder-import', __( 'Empty Import File', 'wp-gridbuilder' ) );
						}
						unlink($upload['file']);
						if ( is_wp_error( $this->last_error ) ) {
							add_action( 'admin_notices', array( $this, 'admin_notices__error' ) );
						} else {
							add_action( 'admin_notices', array( $this, 'admin_notices__success' ) );
						}
						break;
					case 'gridbuilder-theme-sync':
						if ( $count_result = Templates::instance()->fetch_from_theme() ) {
							$this->last_success_message = sprintf( _n( '%d Template updated', '%d Templates updated', $count_result, 'wp-gridbuilder' ), $count_result );
							add_action( 'admin_notices', array( $this, 'admin_notices__success' ) );
						} else {
							$this->last_error = new \WP_Error( 'gridbuilder-theme-sync', __( 'No Templates Synchronized', 'wp-gridbuilder' ) );
							add_action( 'admin_notices', array( $this, 'admin_notices__error' ) );
						}
						
						break;
					case 'gridbuilder-template-export':
						$export = array(
							'meta'	=> array(
								'generator'	=> 'WP GridBuilder',
								'origin'	=> get_bloginfo( 'url' ),
								'date'		=> strftime('%Y-%m-%d %H:%M:%S'),
							),
						);
						$export = Templates::instance()->add_templates( $export );

						$content = json_encode( $export );
						$filename = sprintf( 'wp-gridbuilder-export-%s.json', strftime('%Y-%m-%d-%H-%M-%S') );
						header('Content-Description: File Transfer');
						header('Content-Type: application/json');
						header('Content-Disposition: attachment; filename=' . $filename );
						header('Content-Length: ' . strlen( $content ));

						echo $content;
						
						break;
				}
			} else {
				wp_die( __('Insufficient permission.') );
			}
		}
	}

	/**
	 * 	Render Import/Export page
	 *
	 *	@action ($page_hook)
	 */
	function render_management_page() {
		$count_templates = 0;
		foreach ( array( 'container', 'row', 'cell', 'widget' ) as $type ) {
			$count_templates += count( get_option( "gridbuilder_{$type}_templates" ) );
		}

		$theme_sync_result = Templates::instance()->get_fetch_from_theme_results();

		?><div class="wrap">
			<h2><?php _e( 'GridBuilder Tools' , 'wp-gridbuilder' ); ?></h2>
			<form method="post" enctype="multipart/form-data">
				<?php if ( $count_templates ) { ?>
				<div class="card">
					<h3><?php _e( 'Export Templates' , 'wp-gridbuilder' ); ?></h3>
					<p class="description"><?php _e( 'Hit the export Button to download your Grid object templates.', 'wp-gridbuilder' ) ?></p>
					<?php wp_nonce_field( 'gridbuilder-template-export','gridbuilder-template-export-nonce' ); ?>
					<p>
						<button class="button-secondary" name="action" value="gridbuilder-template-export" type="submit"><?php _e('Export','wp-gridbuilder') ?></button>
					</p>
				</div>
				<?php } ?>
				<div class="card">
					<h3><?php _e( 'Import Templates' , 'wp-gridbuilder' ); ?></h3>
					<?php wp_nonce_field( 'gridbuilder-template-import','gridbuilder-template-import-nonce' ); ?>
					<p class="description"><?php 
						_e( 'Import a set of predefined grid object like containers, rows, cells or widgets.', 'wp-gridbuilder' );
						if ( $count_templates ) {
							?> <?php
							_e( 'If you enable the checkbox below your current template settings will be deleted first.', 'wp-gridbuilder' );
						}
					?></p><?php

					if ( $count_templates ) {
						?><p>
 							<label><?php _e( 'Existing templates:' , 'wp-gridbuilder' ); ?></label>

							<input type="radio" checked="checked" name="gridbuilder-template-override" id="gridbuilder-template-override-keep" value="" />
							<label for="gridbuilder-template-override-keep"><?php _e( 'Keep', 'wp-gridbuilder' ); ?></label>

							<input type="radio" name="gridbuilder-template-override" id="gridbuilder-template-override-update" value="update" />
							<label for="gridbuilder-template-override-update"><?php _e( 'Update', 'wp-gridbuilder' ); ?></label>

							<input type="radio" name="gridbuilder-template-override" id="gridbuilder-template-override-delete" value="delete" />
							<label for="gridbuilder-template-override-delete"><?php _e( 'Delete first', 'wp-gridbuilder' ); ?></label>

						</p><?php
					}
					?><p>	
						<label for="gridbuilder-import-file" class="button-secondary"><?php _e( 'Select File', 'wp-gridbuilder' ); ?></label>
						<input type="file" id="gridbuilder-import-file" name="gridbuilder-import-file" accept="application/json" />
						<em class="filename"></em>
					</p>
					<p>
						<button class="button-primary" disabled="disabled" name="action" value="gridbuilder-template-import" type="submit"><?php _e('Import','wp-gridbuilder') ?></button>
					</p>
				</div>
			</form>
			<?php

			if ( ! empty( $theme_sync_result ) ) {
				?>
				<form method="post">
					<div class="card">
						<h3><?php _e( 'Fetch from Theme' , 'wp-gridbuilder' ); ?></h3>
						<p class="description"><?php 
							_e( 'This import Templates from your Theme. Existing templates will be kept.', 'wp-gridbuilder' );
						?></p>
						<?php wp_nonce_field( 'gridbuilder-theme-sync','gridbuilder-theme-sync-nonce' ); ?>
						<p>
							<button class="button-primary" name="action" value="gridbuilder-theme-sync" type="submit"><?php _e('Fetch','wp-gridbuilder') ?></button>
						</p>
					</div>
				</form>
				<?php
			}

			?>
			<form method="post">
				<div class="card">
					<h3><?php _e( 'Migrate Domain' , 'wp-gridbuilder' ); ?></h3>
					<p class="description"><?php 
						_e( 'This will change all Links and image sources to the new domain name.', 'wp-gridbuilder' );
						?><br /><?php
						_e( 'Use this tool after changing the site URL.', 'wp-gridbuilder' );
					?></p>
					<p>
						<label for="gridbuilder-migrate-from"><?php _e( 'From Domain', 'wp-gridbuilder' ); ?></label>
						<input class="widefat" type="text" id="gridbuilder-migrate-from" name="migrate-from" />
					</p>
					<p>
						<label for="gridbuilder-migrate-to"><?php _e( 'To domain', 'wp-gridbuilder' ); ?></label>
						<input class="widefat" type="text" id="gridbuilder-migrate-to" name="migrate-to"  value="<?php esc_attr_e( get_bloginfo( 'url' ) ); ?>" />
					</p>
					<?php wp_nonce_field( 'gridbuilder-migrate','gridbuilder-migrate-nonce' ); ?>
					<p>
						<button class="button-primary" disabled="disabled" name="action" value="gridbuilder-migrate" type="submit"><?php _e('Migrate','wp-gridbuilder') ?></button>
					</p>
				</div>
			</form>

		</div><?php
	}

	/**
	 * 	Add Admin page to menu
	 *
	 *	@action	load-{$page_hook}
	 */
	function enqueue_admin_page_assets() {
		wp_enqueue_style( 'gridbuilder-tools-page' , plugins_url( 'css/admin/tools.css' , GRIDBUILDER_FILE ) );

		if ( defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ) {
			wp_enqueue_script( 'gridbuilder-tools-page' , plugins_url( 'js/admin/tools.js' , GRIDBUILDER_FILE ) );
		} else {
			wp_enqueue_script( 'gridbuilder-tools-page' , plugins_url( 'js/admin/tools.min.js' , GRIDBUILDER_FILE ) );
		}
//		wp_localize_script('gridbuilder-tools-page' , 'gridbuilder_tools_page' , array( ) );
	}

	/**
	 *	Recursive Search and Replace in assoc
	 *
	 *	@param	mixed	$struct	Array or string
	 *	@param	string	$old
	 *	@param	string	$new
	 *	@return	mixed	$struct with replaced strings
	 */
	private function _replace_deep( $struct, $old, $new ) {
		if ( is_string( $struct ) ) {
			$struct = str_replace( $old, $new, $struct );
		} else if ( is_array( $struct ) ) {
			foreach ( $struct as $k => $v ) {
				$struct[ $k ] = $this->_replace_deep( $v, $old, $new );
			}
		}
		return $struct;
	}
}

