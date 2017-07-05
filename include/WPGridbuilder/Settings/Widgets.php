<?php

namespace WPGridbuilder\Settings;

class Widgets {
	private static $widget_icons = array(
		'WP_Nav_Menu_Widget'		=> 'dashicons-list-view',
		'WP_Widget_Archives'		=> 'dashicons-archive',
		'WP_Widget_Calendar'		=> 'dashicons-calendar-alt',
		'WP_Widget_Categories'		=> 'dashicons-category',
		'WP_Widget_Media_Audio'		=> 'dashicons-format-audio',
		'WP_Widget_Media_Image'		=> 'dashicons-format-image',
		'WP_Widget_Media_Video'		=> 'dashicons-format-video',
		'WP_Widget_Meta'			=> 'dashicons-admin-home',
		'WP_Widget_Pages'			=> 'dashicons-admin-page',
		'WP_Widget_RSS'				=> 'dashicons-rss',
		'WP_Widget_Recent_Posts'	=> 'dashicons-admin-post',
		'WP_Widget_Search'			=> 'dashicons-search',
		'WP_Widget_Tag_Cloud'		=> 'dashicons-tagcloud',
		'WP_Widget_Text'			=> 'dashicons-text',
	);

	private static $widget_default_icon = 'dashicons-wordpress';
	// dashicons-grid-view

	/**
	 *	Widget Types
	 */
	public static function types() {
		global $wp_widget_factory;
	
		$widgets = array();
	
		foreach ( $wp_widget_factory->widgets as $widget_class => $widget ) {
			$icon = isset( self::$widget_icons[ $widget_class ] ) 
				? self::$widget_icons[ $widget_class ] 
				: self::$widget_default_icon;

			$widgets[ $widget_class ] = array(
				'name'			=> $widget->name,
				'description'	=> $widget->widget_options['description'],
				'icon'			=> $icon,
			);
		}
		return apply_filters( 'gridbuilder_widget_types', $widgets );
	}
}
