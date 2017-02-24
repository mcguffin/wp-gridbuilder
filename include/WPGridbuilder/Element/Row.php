<?php


namespace WPGridbuilder\Element;

class Row extends Element {

	protected $type = 'row';

	public function render_content() {
		$output = '';

		if ( ! $this->grid_data[ 'active' ] ) {
			return $output;
		}

		$row_attr = array(
			'id'	=> $this->grid_data['attr_id'],
			'class'	=> array_merge( 
				array( 'row', $this->grid_data['attr_class'] ), 
				$this->mk_visibility_classes( $this->grid_data ),
				$this->mk_fullscreen_classes( $this->grid_data )
			),
		);
		$row_attr = $this->mk_item_attr( $this->grid_data, $row_attr );
		$row_attr = apply_filters( 'gridbuilder_row_attr', $row_attr, $this->grid_data, $this->get_parent()->grid_data );

		$output .= sprintf( '<div %s>', $this->mk_attr( $row_attr ) );
		$output .= $this->background_elements( $this->grid_data );

		foreach ( $this->grid_data['items'] as $cell_data ) {
			$cell	= new Cell( $cell_data, $this );
			$output	.= $cell->render_content();
		}

		$output .= '</div>'; // end row
		return $output;
	}

	public function get_element_defaults() {
		return array(
			'fullscreen'	=> false,
		);
	}


}