<?php


namespace WPGridbuilder\Widget\Field;

class Field {

	protected $name;
	protected $title;
	protected $options;
	protected $wp_widget;

	protected $defaults = array(
		'title'			=> $name,
		'description'	=> false,
	);

	public function __construct( $name, $options, &$wp_widget ) {
		$this->name			= $name;
		$this->options		= wp_parse_args( $options, $this->defaults );
		$this->wp_widget	= $wp_widget;
	}
	protected function get_field_name( $field ) {
		return $this->wp_widget->get_field_name( $field );
	}
	protected function get_field_id( $field ) {
		return $this->wp_widget->get_field_id( $field );
	}

	abstract function output( $value ) {

	}
	abstract function input( $value ) {
		
	}
	
	public function getDefault() {
		return '';
	}
	
	/**
	 *	Sanitize value. Use before outputting value.
	 *
	 *	@param mixed $value
	 *	@return mixed
	 */
	public function sanitizeValue( $value ) {
		return $value;
	}

	/**
	 *	Validatation. Use before wrtiting to database
	 *
	 *	@param mixed $value
	 *	@return bool
	 */
	public function validateValue( $value ) {
		return true;
	}

}
