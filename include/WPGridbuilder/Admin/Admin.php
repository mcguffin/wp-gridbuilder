<?php

namespace WPGridbuilder\Admin;

use WPGridbuilder\Core as Gridbuilder;
use WPGridbuilder\Settings\Templates as TemplateSettings;
use WPGridbuilder\Settings\Editors as EditorSettings;
use WPGridbuilder\Settings\Core as CoreSettings;
use WPGridbuilder\Settings\Widgets as WidgetSettings;



class Admin {
	private static $_instance = null;
	
	private $tool_page_name = 'gridbuilder-management';
	
	/**
	 * Getting a singleton.
	 *
	 * @return object single instance of GridbuilderAdmin
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) )
			self::$_instance = new self();
		return self::$_instance;
	}

	/**
	 * Private constructor
	 */
	private function __construct() {
		add_action( 'admin_init' , array( &$this , 'admin_init' ) );
		add_action( "admin_init" , array( &$this , 'register_assets' ) );

		/*
		add_action( 'load-page.php', array( &$this, 'enqueue_grid_assets' ) );
		add_action( 'load-post.php', array( &$this, 'enqueue_grid_assets' ) );
		add_action( 'load-post-new.php', array( &$this, 'enqueue_grid_assets' ) );
		/*/
		add_action( 'wp_enqueue_media', array( &$this, 'enqueue_grid_assets' ) );
		//*/

		add_action( 'print_media_templates',  array( &$this, 'print_media_templates' ) );

		add_action( 'save_post', array( &$this, 'save_post' ) );
		add_action( 'pre_post_content', array( &$this, 'pre_post_content' ) );

		add_action( 'edit_form_top', array( &$this, 'edit_form_top' ) );

		add_action( 'wp_ajax_gridbuilder-create-template', array( &$this, 'ajax_save_template' ) );
		add_action( 'wp_ajax_gridbuilder-update-template', array( &$this, 'ajax_save_template' ) );
		add_action( 'wp_ajax_gridbuilder-delete-template', array( &$this, 'ajax_delete_template' ) );
		add_action( 'wp_ajax_gridbuilder-get-widget', array( &$this, 'ajax_get_widget' ) );

		add_option( 'gridbuilder_container_templates', array() );
		add_option( 'gridbuilder_row_templates', array() );
		add_option( 'gridbuilder_cell_templates', array() );
		add_option( 'gridbuilder_widget_templates', array() );

		add_option( 'gridbuilder_post_types', array('post','page') );
	}


	/**
	 *	Admin init
	 *
	 *	@action admin_init
	 */
	function admin_init() {
		add_action( 'personal_options_update', array( &$this, 'user_profile_update' ) );
		add_action( 'profile_personal_options', array( &$this, 'user_profile_edit' ) );
	}

	/**
	 *	Update User Profile
	 *
	 *	@action personal_options_update
	 */
	function user_profile_update( $user_id ) {
		set_user_setting( 'gridbuilder_features_locks', isset( $_POST['gridbuilder_features_locks'] ) );
	}
	
	/**
	 *	Output User Profile Editor HTML
	 *
	 *	@action profile_personal_options
	 */
	function user_profile_edit( $profileuser ) {
		?><table class="form-table">
			<tbody>
				<tr class="gridbuilder-user-features-locks">
					<th scope="row"><?php 
						_e( 'Gridbuilder Locks', 'wp-gridbuilder' );
					?></th>
					<td>
						<fieldset>
							<legend class="screen-reader-text"><span><?php _e( 'Gridbuilder Locks', 'wp-gridbuilder' ) ?></span></legend>
							<label for="gridbuilder-features-locks">
							<input name="gridbuilder_features_locks" type="checkbox" id="gridbuilder-features-locks" value="1" <?php checked( get_user_setting( 'gridbuilder_features_locks', false ) ) ?>>
								<?php _e( 'Enable Element locking', 'wp-gridbuilder' ) ?>
							</label>
							<p class="description"><?php 
								_e( 'If checked you can lock certain elements and properties of a page layout.', 'wp-gridbuilder' );
							?></p>
						</fieldset>
					</td>
				</tr>
			</tbody>
		</table><?php
	}

	/**
	 *	Ajax: Get Widget form.
	 *
	 *	@action wp_ajax_gridbuilder-get-widget
	 */
	function ajax_get_widget() {
		global $wp_widget_factory;

		if ( isset( $_POST[ 'nonce' ],  $_POST[ 'widget_class' ], $_POST[ 'instance' ] ) && wp_verify_nonce( $_POST[ 'nonce' ], $_REQUEST[ 'action' ] ) && current_user_can( 'edit_posts' ) ) {
			$instance = json_decode( stripslashes( $_POST[ 'instance' ] ), true );
			header( 'Content-Type: text/html' );
			$widget_class = str_replace( '\\\\', '\\', rawurldecode( $_POST[ 'widget_class'] ) );

			if ( class_exists( $widget_class ) && isset( $wp_widget_factory->widgets[ $widget_class ] ) ) {
				$widget = $wp_widget_factory->widgets[ $widget_class ];
				printf( '<div id="%s" class="widget">', $widget->id );
				$widget->form( $instance );
				echo '</div>';
				//*/
			} else {
				// error due to non-existing widget
				echo '<div id="gridbuilder-error-widget" class="widget">';
				printf( '<p class="description">%s</p>', 
					sprintf( __( 'Widget “%s” is unavailable. This is what you entered.', 'wp-gridbuilder' ), sanitize_text_field( $widget_class ) ) 
				);
				
				foreach ( $instance as $key => $value ) {
					$k = sanitize_key($key);
					printf( "<label for=\"gridbuilder_error_widget-%s\"><strong>%s</strong></label>: <textarea class=\"widefat code\" id=\"gridbuilder_error_widget-%s\" name=\"gridbuilder_error_widget[%s]\" readonly>%s</textarea>\n\n", 
						$k, $k, $k, $k, 
						esc_textarea($value)
					);
				}
				echo '</div>';
			}
		}
		die('');
	}

	/**
	 *	Ajax: Delete a template
	 */
	function ajax_delete_template() {
		if ( isset( $_POST[ 'nonce' ],  $_POST[ 'template' ] ) && wp_verify_nonce( $_POST[ 'nonce' ], $_REQUEST[ 'action' ] ) && current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ) ) {
			$template = json_decode( stripslashes( $_POST[ 'template' ] ), true );
			
			$template = wp_parse_args($template, array(
				'slug'	=> '',
				'type'	=> false,
			));
			$type = in_array( $template['type'], array( 'container', 'row', 'cell', 'widget' ) ) ? $template['type'] : false;
			if ( $type !== false && ! empty( $template['slug'] ) ) {
				$templates = get_option( "gridbuilder_{$type}_templates" );
				if ( isset( $templates[ $template['slug'] ] ) ) {
					unset( $templates[ $template['slug'] ] );
					update_option( "gridbuilder_{$type}_templates", $templates );
				}
				header( 'Content-Type: application/json' );
				echo json_encode( array( 'success' => true ) );
			}
		}
		die('');
	}

	/**
	 *	Ajax: Create or update a template
	 */
	function ajax_save_template() {
		if ( isset( $_POST[ 'nonce' ],  $_POST[ 'template' ] ) && wp_verify_nonce( $_POST[ 'nonce' ], $_REQUEST[ 'action' ] ) && current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ) ) {


			$template = json_decode( stripslashes( $_POST[ 'template' ] ), true );
			
			$template = wp_parse_args($template, array(
				'name'	=> '',
				'slug'	=> '',
				'data'	=> (object) array(),
				'type'	=> false,
			));
			$type = in_array( $template['type'], array( 'container', 'row', 'cell', 'widget' ) ) ? $template['type'] : false;

			if ( $type !== false && ! empty( $template['name'] ) && ! empty( $template['slug'] ) && ! empty( $template['data'] ) ) {
				$templates = get_option( "gridbuilder_{$type}_templates" );

				$template['name'] = sanitize_text_field( $template['name'] );

				// use unique slug if create
				if ( $_REQUEST[ 'action' ] == 'gridbuilder-create-template' && isset( $templates[ $template['slug'] ] ) ) {
					$i = 1;
					while ( isset( $templates[ $template['slug'] . '-' . $i ] ) ) {
						$i++;
					}
					$template['slug'] = $template['slug'] . '-' . $i;
				} else {
					$template['slug'] = sanitize_title( $template['slug'] );
				}

				$templates[ $template['slug'] ] = $template;
				update_option( "gridbuilder_{$type}_templates", $templates );
			}
			
			header( 'Content-Type: application/json' );
			echo json_encode( $template );
		}
		die('');
	}

	/**
	 *	Hidden input field in post editor
	 *
	 *	@action edit_form_top
	 */
	function edit_form_top() {
		if ( $this->is_enabled_for_post_type() ) {
			if ( $post_id = get_the_ID() ) {
				$grid_data		= get_post_meta( $post_id, '_grid_data', true );
				$grid_enabled	= get_post_meta( $post_id, '_grid_enabled', true );
			} else {
				$grid_data		= json_encode( array() );
				$grid_enabled	= false;
			}
			?><input type="hidden" name="_grid_enabled" value="<?php echo intval ( $grid_enabled ); ?>" /><?php
			?><input type="hidden" name="_grid_data" value="<?php esc_attr_e( json_encode( $grid_data ) ) ?>" /><?php
		}
	}

	/**
	 *	Save Grid postmeta
	 *
	 *	@action save_post
	 */
	function save_post( $post_id ) {
		if ( $this->is_enabled_for_post_type() && $post_id && isset( $_POST['_grid_data'] ) ) {
			$grid_data		= json_decode( stripslashes( $_POST['_grid_data'] ), true );
			$grid_enabled	= isset( $_POST['_grid_enabled'] ) ? intval( $_POST['_grid_enabled'] ) : 0;
			update_post_meta( $post_id, '_grid_data', $grid_data );
			update_post_meta( $post_id, '_grid_enabled', $grid_enabled );
		}
	}

	/**
	 *	Save Grid result in post content
	 *
	 *	@filter pre_post_content
	 */
	function pre_post_content( $value ) {
		if ( $this->is_enabled_for_post_type() && isset( $_POST['_grid_data'], $_POST['_grid_enabled'] ) && intval( $_POST['_grid_enabled'] ) ) {
			$grid_data = json_decode( stripslashes( $_POST['_grid_data'] ), true );
			$value = Gridbuilder::instance()->get_content( $grid_data );
		}
		return $value;
	}
	
	/**
	 *	Get current post type
	 *
	 *	@filter pre_post_content
	 */
	private function get_post_type( ) {
		$post_id = null;
		if ( isset( $_REQUEST[ 'post' ] ) ) {
			$post_id = intval( $_REQUEST[ 'post' ] );
		}
		$post_type = get_post_type( $post_id );
		
		if ( ! $post_type && isset( $_REQUEST[ 'post_type' ] ) ) {
			$post_type = $_REQUEST[ 'post_type' ];
		}
		if ( post_type_exists( $post_type ) ) {
			return $post_type;
		}
		return false;
	}
	
	/**
	 *	Check if pagebuilder is enabled for post type
	 *
	 *	@return bool
	 */
	public function is_enabled_for_post_type() {
		$post_types = (array) get_option( 'gridbuilder_post_types' );
		return in_array( $this->get_post_type(), $post_types );
	}

	/**
	 *	Enqueue scripts
	 *
	 *	@action load-page.php
	 *	@action load-post.php
	 *	@action load-post-new.php
	 */
	function enqueue_grid_assets(){
/*
		if ( ! did_action( 'wp_enqueue_media' ) ) {
			wp_enqueue_media();
		}
*/
		wp_enqueue_script( 'gridbuilder-admin' );
		wp_enqueue_style( 'gridbuilder-admin' );
	}

	/**
	 * 	Register Assets
	 *
	 *	@action admin_init
	 */
	function register_assets() {
		if ( $this->is_enabled_for_post_type() ) {
			$version = '2016-09-23';

			wp_register_style( 'gridbuilder-admin' , plugins_url( '/css/admin/edit.css', GRIDBUILDER_FILE ), array('wp-color-picker', ), $version);

			if ( defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ) {

				$script_id = 'gridbuilder-base';

				wp_register_script( 'sortable' , 
					plugins_url( 'js/src/Sortable/Sortable.js' , GRIDBUILDER_FILE ), 
					array(), 
				$version );

				wp_register_script( 'jquery-sortable' , 
					plugins_url( 'js/src/Sortable/jquery.binding.js' , GRIDBUILDER_FILE ), 
					array( 'jquery', 'sortable' ), 
				$version );

				wp_register_script( $script_id, 
					plugins_url( 'js/src/admin/edit/grid-base.js' , GRIDBUILDER_FILE ), 
					array( 'wp-backbone' ), 
				$version );

				wp_register_script( 'gridbuilder-model', 
					plugins_url( 'js/src/admin/edit/grid-model.js' , GRIDBUILDER_FILE ), 
					array( $script_id ), 
				$version );


				wp_register_script( 'gridbuilder-ui', 
					plugins_url( 'js/src/admin/edit/grid-ui.js' , GRIDBUILDER_FILE ), 
					array( 'gridbuilder-model'), 
				$version );

				wp_register_script( 'gridbuilder-dialog-views', 
					plugins_url( 'js/src/admin/edit/grid-dialog-views.js' , GRIDBUILDER_FILE ), 
					array( 'wp-color-picker', 'gridbuilder-model','gridbuilder-ui'), 
				$version );

				wp_register_script( 'gridbuilder-element', 
					plugins_url( 'js/src/admin/edit/grid-element.js' , GRIDBUILDER_FILE ), 
					array( 'gridbuilder-model','gridbuilder-dialog-views','jquery-sortable'), 
				$version );

				wp_register_script( 'gridbuilder-admin', 
					plugins_url( 'js/src/admin/edit.js' , GRIDBUILDER_FILE ), 
					array( 'gridbuilder-element' ), 
				$version );

			} else {
				$script_id = 'gridbuilder-admin';

				wp_register_script( $script_id, plugins_url( 'js/admin/edit.min.js' , GRIDBUILDER_FILE ), array('jquery', 'wp-backbone', 'wp-color-picker', 'media-views' ), $version );
			}

			wp_localize_script ( $script_id, 'gridbuilder' , array(
				'l10n'		=> array(
					'Edit'				=> __( 'Edit',  'wp-gridbuilder' ),

					'EditGrid'			=> __( 'Edit Grid',  'wp-gridbuilder' ),
					'EditText'			=> __( 'Edit Text',  'wp-gridbuilder' ),
					'Done'				=> __( 'Done',  'wp-gridbuilder' ),
					'Delete'			=> __( 'Delete',  'wp-gridbuilder' ),
				
					'Grid'				=> __( 'Grid',  'wp-gridbuilder' ),
					'Container'			=> __( 'Container',  'wp-gridbuilder' ),
					'Row'				=> __( 'Row',  'wp-gridbuilder' ),
					'Cell'				=> __( 'Cell',  'wp-gridbuilder' ),
					'Widget'			=> __( 'Widget',  'wp-gridbuilder' ),

					'EditContainer'		=> __( 'Edit Container',  'wp-gridbuilder' ),
					'EditRow'			=> __( 'Edit Row',  'wp-gridbuilder' ),
					'EditCell'			=> __( 'Edit Cell',  'wp-gridbuilder' ),
					'EditWidget'		=> __( 'Edit Widget',  'wp-gridbuilder' ),

					'Template'			=> __( 'Template',  'wp-gridbuilder' ),
					'Templates'			=> __( 'Templates',  'wp-gridbuilder' ),
					'ManageTemplates'
										=> __( 'Manage Templates',  'wp-gridbuilder' ),
					'TemplateName'		=> __( 'Template Name',  'wp-gridbuilder' ),
					'CreateTemplateDescription'
										=> __( 'The Template will be available at blahblah...',  'wp-gridbuilder' ),
				
					'WidgetTypes'		=> __( 'Widget Types',  'wp-gridbuilder' ),
					'SelectWidget'		=> __( 'Select Widget',  'wp-gridbuilder' ),
					
					'unkonwnWidget'		=> __( 'Unknown Widget:',  'wp-gridbuilder' ),
				),
				'options'	=> array(
					'ajaxurl'				=> admin_url( 'admin-ajax.php' ),
					'create_template_nonce'	=> wp_create_nonce( 'gridbuilder-create-template' ),
					'update_template_nonce'	=> wp_create_nonce( 'gridbuilder-update-template' ),
					'delete_template_nonce'	=> wp_create_nonce( 'gridbuilder-delete-template' ),
					'get_widget_nonce'		=> wp_create_nonce( 'gridbuilder-get-widget' ),


					'editors'	=> array(
						'container'	=> EditorSettings::container(),
						'row'		=> EditorSettings::row(),
						'cell'		=> EditorSettings::cell(),
						'widget'	=> EditorSettings::widget(),
					),
					// element templates
					'templates' => array(
						'container'		=> TemplateSettings::container(),
						'row'			=> TemplateSettings::row(),
						'cell'			=> TemplateSettings::cell(),
						'widget'		=> TemplateSettings::widget(),
					),

					// allowed
					'widgets'			=> WidgetSettings::types(),
					'screensizes'		=> CoreSettings::screen_sizes(),
					'default_widget'	=> apply_filters( 'gridbuilder_default_widget', 'WP_Widget_Text'),
					'default_widget_content_property'	
										=> apply_filters( 'gridbuilder_default_widget_content_property', 'description'),
					'features'			=> array(
						// manage templates
						'templates'	=> current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ),
						// locking
						'locks'		=> get_user_setting( 'gridbuilder_features_locks', false ),
					),
				),
			) );
		}
	}


	/**
	 *	@action 'print_media_templates'
	 */
	function print_media_templates() {
		if ( $this->is_enabled_for_post_type() ) {
			$rp = GRIDBUILDER_DIRECTORY . 'include' . DIRECTORY_SEPARATOR . '/template/{,*/,*/*/,*/*/*/}*.php';
			foreach ( glob( $rp, GLOB_BRACE ) as $template_file ) {	
				include $template_file;
			}
		}
	}

}

