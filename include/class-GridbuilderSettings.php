<?php


if ( ! class_exists( 'GridbuilderSettings' ) ):
class GridbuilderSettings {
	private static $_instance = null;
	
	/**
	 * Setup which to WP options page the Rainbow options will be added.
	 * 
	 * Possible values: general | writing | reading | discussion | media | permalink
	 */
	private $optionset = 'gridbuilder';
	private $options_page_name = 'gridbuilder-options';
	/**
	 * Getting a singleton.
	 *
	 * @return object single instance of GridbuilderSettings
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
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		
		add_action( 'admin_menu', array( $this, 'add_options_page' ) );

		add_option( 'gridbuilder_frontend_enqueue_bootstrap' , false, '', false );
		
		add_option( 'gridbuilder_manage_templates_capability' , 'edit_theme_options' );
	}

	/**
	 * 	Add Admin page to menu
	 *
	 *	@action	admin_menu
	 */
	function add_options_page() {
		$page_hook = add_options_page( __( 'GridBuilder Options' , 'wp-gridbuilder' ), __( 'GridBuilder' , 'wp-gridbuilder' ), 'manage_options', $this->options_page_name, array( &$this , 'render_options_page' ) );
	}

	/**
	 * 	Render the options page
	 */
	function render_options_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
		}
		?><div class="wrap">
			<h2><?php _e( 'GridBuilder Options',  'wp-gridbuilder' ); ?></h2>

			<form action="options.php" method="post">
				<?php
				settings_fields(  $this->optionset );
				do_settings_sections( $this->optionset );
				submit_button( __('Save Settings' , 'wp-gridbuilder' ) );
				?>
			</form>
		</div><?php
	}

	/**
	 * Setup options page.
	 */
	function register_settings() {
		$settings_section = 'gridbuilder_settings';
		
		add_settings_section( $settings_section, null, null, $this->optionset );
		
		$setting_name = 'gridbuilder_frontend_enqueue_bootstrap';
		// more settings go here ...
		register_setting( $this->optionset, $setting_name, 'intval' );

		// ... and here
		add_settings_field(
			$setting_name,
			__( 'Enqueue Bootstrap CSS and JS',  'wp-gridbuilder' ),
			array( $this, 'setting_checkbox_ui' ),
			$this->optionset,
			$settings_section,
			$setting_name
		);
	}
	
	/**
	 * Output Theme selectbox
	 */
	public function setting_checkbox_ui( $setting_name ){
		$setting = get_option( $setting_name );
		?><input type="checkbox" name="<?php echo $setting_name ?>" <?php checked(intval($setting),1) ?> value="1" /><?php
	}

}

GridbuilderSettings::instance();
endif;