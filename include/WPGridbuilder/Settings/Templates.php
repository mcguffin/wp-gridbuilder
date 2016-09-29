<?php


namespace WPGridbuilder\Settings;

/**
 *	Manage Element Templates
 */
class Templates {

	public static function container() {
		return apply_filters( 'gridbuilder_container_templates', get_option( 'gridbuilder_container_templates', (object) array() ) );
	}

	public static function row() {
		return apply_filters( 'gridbuilder_row_templates', get_option( 'gridbuilder_row_templates', (object) array() ) );
	}

	public static function cell() {
		return apply_filters( 'gridbuilder_cell_templates', get_option( 'gridbuilder_cell_templates', (object) array() ) );
	}

	public static function widget() {
		return apply_filters( 'gridbuilder_widget_templates', get_option( 'gridbuilder_widget_templates', (object) array() ) );
	}

}