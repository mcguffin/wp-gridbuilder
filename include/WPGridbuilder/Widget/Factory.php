<?php


namespace WPGridbuilder\Widget;

class Factory {
	
	private $widgets = array();

	private static $_instance = null;

	/**
	 * Getting a singleton.
	 *
	 * @return object single instance of Gridbuilder
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) )
			self::$_instance = new self();
		return self::$_instance;
	}

	/**
	 *	Prevent Instantinating
	 */
	private function __clone() { }
	private function __wakeup() { }


	/**
	 *	Private constructor
	 */
	private function __construct() {
		add_action( 'widgets_init', array( $this, 'widgets_init' ) );
	}


	public function make( $slug, $title, $description = '', $fields = array( ) ) {
		$classname = sprintf( 'gridbuilder_widget_%s', sanitize_title( $slug ) );
		$this->widgets[ $classname ] = (object) array(
			'title'			=> $title,
			'description'	=> $description,
			'fields'		=> $fields,
		);

		eval( "class {$classname} extends WPGridbuilder\Widget\Generic { }" );
	}

	public static function widget( $classname ) {
		return self::instance()->widgets[ $classname ];
	}


	/**
	 *	@action widgets_init
	 */
	public function widgets_init() {
		foreach ( $this->widgets as $classname => $settings ) {
			register_widget( $classname );
		}
	}
}

