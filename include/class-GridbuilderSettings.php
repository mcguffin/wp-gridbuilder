<?php


if ( ! class_exists( 'GridbuilderSettings' ) ):
class GridbuilderSettings {
	private static $_instance = null;
	
	/**
	 * Setup which to WP options page the Rainbow options will be added.
	 * 
	 * Possible values: general | writing | reading | discussion | media | permalink
	 */
	private $optionset = 'reading';

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
		add_action( 'admin_init' , array( &$this , 'register_settings' ) );
		
		add_option( 'gridbuilder_frontend_enqueue_bootstrap' , false , '' , False );
	}

	/**
	 * Enqueue options Assets
	 */
	function enqueue_assets() {

	}
	


	/**
	 * Setup options page.
	 */
	function register_settings() {
		$settings_section = 'gridbuilder_settings';
		
		add_settings_section( $settings_section, __( 'WP-Gridbuilder',  'wp-gridbuilder' ), '__return_empty_string', $this->optionset );
		
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