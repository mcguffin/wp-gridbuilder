<?php


namespace WPGridbuilder\Element;

class Cell extends Element {
	
	protected $type = 'cell';
	
	public function render_content() {
		$output = '';

		if ( ! $this->grid_data[ 'active' ] ) {
			return $output;
		}

		$cell_attr = array(
			'id'	=> $this->grid_data['attr_id'],
			'class'	=> array_merge(  
				array( 'cell', $this->grid_data['attr_class'] ),
				$this->mk_grid_classes( $this->grid_data ),
				$this->mk_visibility_classes( $this->grid_data ),
				$this->mk_fullscreen_classes( $this->grid_data )
			),
		);

		$cell_attr = $this->mk_item_attr( $this->grid_data, $cell_attr );
		$cell_attr = apply_filters( 'gridbuilder_cell_attr', $cell_attr, $this->grid_data, $this->get_parent()->grid_data, $this->get_parent()->get_parent()->grid_data );
		$output .= sprintf( '<div %s>', $this->mk_attr( $cell_attr ) );
		$output .= $this->background_elements( $this->grid_data );

		foreach ( $this->grid_data['items'] as $widget_data ) {
			$widget = new Widget( $widget_data, $this );
			$output .= $widget->render_content();
		}
		$output .= '</div>'; // end cell
		return $output;
	}

	public function get_element_defaults() {
		return array(
			'fullscreen'	=> false,
		);
	}

}