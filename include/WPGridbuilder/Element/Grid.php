<?php


namespace WPGridbuilder\Element;

class Grid extends Element {

	protected $type = 'grid';

	public function render_content() {

		global $wp_widget_factory;

		$output = '';

		foreach ( $this->grid_data['items'] as $container_data ) {
			$container = new Container( $container_data, $this );
			$output .= $container->render_content();
		}

		return $output;	
	}

	public function get_element_defaults() {
		return array();
	}

}