<?php


namespace WPGridbuilder\Element;

class Widget extends Element {

	protected $type = 'widget';

	public function render_content() {

		$output = '';

		if ( ! $this->grid_data[ 'active' ] ) {
			return $output;
		}

		global $wp_widget_factory;


		$widget_class	= rawurldecode( $this->grid_data['widget_class'] );


		if ( isset( $wp_widget_factory->widgets[ $widget_class ] ) ) {
			$wp_widget = $wp_widget_factory->widgets[ $widget_class ];
			$widget_id		= isset( $row['attr_id'] ) ? $row['attr_id'] : ( $wp_widget->id_base . '-' . $this->getCount());
			$widget_attr = array(
				'id'	=> $widget_id,
				'class'	=> array_merge(
					array( 'widget', 'widget-'.$wp_widget->id_base, $this->grid_data['attr_class'] ),
					$this->mk_visibility_classes( $this->grid_data ),
					$this->mk_grid_classes( $this->grid_data )
				),
			);
			$widget_attr = $this->mk_item_attr( $this->grid_data, $widget_attr );
			$widget_attr = apply_filters( 'gridbuilder_widget_attr', $widget_attr, $this->grid_data, $this->get_parent()->grid_data, $this->get_parent()->get_parent()->grid_data, $this->get_parent()->get_parent()->get_parent()->grid_data );
			$output .= sprintf( '<div %s>', $this->mk_attr( $widget_attr ) );
			$output .= $this->background_elements( $this->grid_data );

			ob_start();

			/* args instance */

			$instance = apply_filters( 'widget_display_callback', $this->grid_data['instance'], $wp_widget, $this->grid_data );

			if ( $instance !== false ) {
				$wp_widget->widget( $this->grid_data, $instance );
			}

			$widget_output = ob_get_clean();

			$output .= $widget_output;
			$output .= '</div>'; // end widget
		} else if ( define( 'WP_DEBUG' ) && WP_DEBUG ) {
			$output .= sprintf( 'Widget Class not found: %s', $widget_class );
		}
		return $output;

	}

	public function get_element_defaults() {
		return array(
			'widget_class'	=> false,
			'instance'		=> array(),

			'before_widget'	=> false,
			'after_widget'	=> false,
			'before_title'	=> false,
			'after_title'	=> false,
		);
	}

}
