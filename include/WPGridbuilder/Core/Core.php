<?php

namespace WPGridbuilder\Core;

use WPGridbuilder\Element;

class Core extends Singleton {

	/**
	 *	Private constructor
	 */
	protected function __construct() {
		add_action( 'plugins_loaded' , array( &$this , 'load_textdomain' ) );
		add_action( 'init' , array( &$this , 'init' ) );
		add_action( 'wp_enqueue_scripts' , array( &$this , 'wp_enqueue_style' ) );

		register_activation_hook( GRIDBUILDER_FILE, array( __CLASS__ , 'activate' ) );
		register_deactivation_hook( GRIDBUILDER_FILE, array( __CLASS__ , 'deactivate' ) );
		register_uninstall_hook( GRIDBUILDER_FILE, array( __CLASS__ , 'uninstall' ) );
		
		add_filter( 'the_content', array( $this,'the_content' ) );

		AnchorNav::instance();

	}

	/**
	 *	Load frontend styles and scripts
	 *
	 *	@action wp_enqueue_scripts
	 */
	function wp_enqueue_style() {
		if ( get_option( 'gridbuilder_frontend_enqueue_bootstrap' ) ) {
			wp_enqueue_style( 'gridbuilder-frontend', plugins_url( 'css/frontend-bootstrap.css', GRIDBUILDER_FILE ) );
			wp_enqueue_script( 'bootstrap', plugins_url( 'js/bootstrap/bootstrap.min.js', GRIDBUILDER_FILE ), array( 'jquery' ) );
		} else if ( get_option( 'gridbuilder_frontend_enqueue_style' ) ) {
			wp_enqueue_style( 'gridbuilder-frontend', plugins_url( 'css/frontend.css', GRIDBUILDER_FILE ) );
		}
	}

	/**
	 *	Output Grid generated HTML
	 *
	 *	@filter the_content
	 */
	public function the_content( $the_content ) {
		if ( get_post_meta( get_the_ID(), '_grid_enabled', true )  && ( $grid_data = get_post_meta( get_the_ID(), '_grid_data', true ) ) ) {
			return $this->get_content( $grid_data );
		}
		return $the_content;
	}
	
	public function get_content( $grid_data ) {
		$grid = new Element\Grid( $grid_data );
		return $grid->render_content( $grid_data );
	}

	/**
	 *	Load text domain
	 * 
	 *  @action plugins_loaded
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'wp-gridbuilder' , false, GRIDBUILDER_DIRECTORY . '/languages/' );
	}

	/**
	 *	Init hook.
	 * 
	 *  @action init
	 */
	function init() {
	}



	/**
	 *	Fired on plugin activation
	 */
	public static function activate() {
	
	
	}

	/**
	 *	Fired on plugin deactivation
	 */
	public static function deactivate() {
	}
	/**
	 *	Fired on plugin deinstallation
	 */
	public static function uninstall(){
		delete_option( 'gridbuilder_container_templates');
		delete_option( 'gridbuilder_row_templates' );
		delete_option( 'gridbuilder_cell_templates' );
		delete_option( 'gridbuilder_widget_templates' );
		delete_option( 'gridbuilder_frontend_enqueue_bootstrap' );
	}

}
