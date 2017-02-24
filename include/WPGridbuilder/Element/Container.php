<?php


namespace WPGridbuilder\Element;

class Container extends Element {

	protected $type = 'container';

	public function render_content() {
		$output = '';

		if ( ! $this->grid_data[ 'active' ] ) {
			return $output;
		}

		// container wrap
		$container_wrap_attr = array(
			'id'	=> $this->grid_data['attr_id'],
			'class'	=> array_merge( 
					array( 'container-wrap', $this->grid_data['attr_class'] ), 
					$this->mk_visibility_classes( $this->grid_data ),
					$this->mk_fullscreen_classes( $this->grid_data )
			),
		);

		$container_wrap_attr = $this->mk_item_attr( $this->grid_data, $container_wrap_attr );
		$container_wrap_attr = apply_filters( 'gridbuilder_container_wrapper_attr', $container_wrap_attr, $this->grid_data );

		$output .= sprintf( '<%s %s>', $this->grid_data['tagname'], $this->mk_attr( $container_wrap_attr ) );

		// container bg elements
		$output .= $this->background_elements( $this->grid_data );
		
		$output .= apply_filters( 'gridbuilder_before_container', '', $this->grid_data );
		// container 
		$container_attr = array(
			'class'	=> $this->grid_data['fluid'] ? 'container-fluid' : 'container',
		);
		$container_attr = apply_filters( 'gridbuilder_container_attr', $container_attr, $this->grid_data );

		$output .= sprintf( '<div %s>', $this->mk_attr( $container_attr ) );
		$output .= apply_filters( 'gridbuilder_inside_container_before', '', $this->grid_data );

		foreach ( $this->grid_data['items'] as $row_data ) {
			$row	= new Row( $row_data, $this );
			$output	.= $row->render_content();
		}

		$output .= apply_filters( 'gridbuilder_inside_container_after', '', $this->grid_data );
		$output .= '</div>'; // end container
		$output .= apply_filters( 'gridbuilder_after_container', '', $this->grid_data );
		$output .= sprintf( '</%s>', $this->grid_data['tagname'] ); // end container wrapper
		return $output;
	}

	public function get_element_defaults() {
		return array(
			'title'			=> '',
			'subtitle'		=> '',
			'fluid'			=> false,
			'tagname'		=> 'div',
			'fullscreen'	=> false,
		);
	}

}