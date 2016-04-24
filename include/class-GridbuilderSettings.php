<?php


if ( ! class_exists( 'GridbuilderSettings' ) ):
class GridbuilderSettings {
	private static $_instance = null;
	
	/**
	 * Setup which to WP options page the Rainbow options will be added.
	 * 
	 * Possible values: general | writing | reading | discussion | media | permalink
	 */
	private $optionset = 'general'; // writing | reading | discussion | media | permalink

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
		
		add_option( 'gridbuilder_setting_1' , 'Default Value' , '' , False );
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
		// more settings go here ...
		register_setting( $this->optionset , 'gridbuilder_setting_1' , array( &$this , 'sanitize_setting_1' ) );

		add_settings_section( $settings_section, __( 'Section #1',  'wp-gridbuilder' ), array( &$this, 'section_1_description' ), $this->optionset );
		// ... and here
		add_settings_field(
			'gridbuilder_setting_1',
			__( 'Setting #1',  'wp-gridbuilder' ),
			array( $this, 'setting_1_ui' ),
			$this->optionset,
			$settings_section
		);
	}

	/**
	 * Print some documentation for the optionset
	 */
	public function section_1_description() {
		?>
		<div class="inside">
			<p><?php _e( 'Section 1 Description.' , 'wp-gridbuilder' ); ?></p>
		</div>
		<?php
	}
	
	/**
	 * Output Theme selectbox
	 */
	public function setting_1_ui(){
		$setting_name = 'gridbuilder_setting_1';
		$setting = get_option($setting_name);
		?><input type="text" name="<?php echo $setting_name ?>" value="<?php esc_attr_e( $setting ) ?>" /><?php
	}
	

	/**
	 * Sanitize value of setting_1
	 *
	 * @return string sanitized value
	 */
	function sanitize_setting_1( $value ) {	
		// do sanitation here!
		return $value;
	}
}

GridbuilderSettings::instance();
endif;