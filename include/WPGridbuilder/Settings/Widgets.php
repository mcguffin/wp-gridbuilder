<?php

namespace WPGridbuilder\Settings;

class Widgets {
	/**
	 *	Widget Types
	 */
	public static function types() {
		global $wp_widget_factory;
	
		$widgets = array();
	
		foreach ( $wp_widget_factory->widgets as $widget_class => $widget ) {
			$widgets[ $widget_class ] = array(
				'name' => $widget->name,
				'description' => $widget->widget_options['description'],
			);
		}
		return apply_filters( 'gridbuilder_widget_types', $widgets );
	}
}
