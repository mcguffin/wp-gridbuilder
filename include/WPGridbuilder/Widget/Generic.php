<?php

namespace WPGridbuilder\Widget;

class Generic extends \WP_Widget {
	
	protected $fields = array();

	public function __construct() {

		$classname = get_class( $this );

		$settings = Factory::widget( $classname );

		$widget_options = array( 
			'classname'		=> $classname,
			'description'	=> $settings->description,
		);

		foreach ( $settings->fields as $field_name => $field_settings ) {
			$cls = $field_settings['class'];
			$this->fields[ $field_name ] = new $cls( $field_name, $field_settings, $this );
		}

		parent::__construct( 'my_widget', $settings->title, $widget_options );
	}

	public function widget( $args, $instance ) {
	}

	public function form( $instance ) {
		foreach ( $this->fields as $field_name => $field ) {
			$val = isset( $instance[ $field_name ] ) ? $instance[ $field_name ] : $field->getDefault();
			$field->form();
		}
	}

	public function update( $new_instance, $old_instance ) {
		
	}
}