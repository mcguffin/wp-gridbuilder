<?php


namespace WPGridbuilder\Widget\Field;

class Text extends Field {

	function output( $value ) {
		echo $value;
	}

	function form( $value ) {
		printf( '<input type="text" name="%s" value="%s" >',
				esc_attr( $this->get_field_name() ),
				esc_attr($value)
			);
	}
}
