<?php


namespace WPGridbuilder\Settings;

/**
 *	Manage Element Templates
 */
class Templates {

	public static function container() {
		$templates = apply_filters( 'gridbuilder_container_templates', get_option( 'gridbuilder_container_templates', (object) array() ) );
		$templates = self::keep_string_keys( $templates );
		return $templates;
	}

	public static function row() {
		$templates = apply_filters( 'gridbuilder_row_templates', get_option( 'gridbuilder_row_templates', (object) array() ) );
		$templates = self::keep_string_keys( $templates );
		return $templates;
	}

	public static function cell() {
		$templates = apply_filters( 'gridbuilder_cell_templates', get_option( 'gridbuilder_cell_templates', (object) array() ) );
		$templates = self::keep_string_keys( $templates );
		return $templates;
	}

	public static function widget() {
		$templates = apply_filters( 'gridbuilder_widget_templates', get_option( 'gridbuilder_widget_templates', (object) array() ) );
		$templates = self::keep_string_keys( $templates );
		return $templates;
	}
	private static function keep_string_keys($arr) {
		foreach ($arr as $key => $value) {
			if (is_int($key)) {
				unset($arr[$key]);
			}
		}
		return $arr;
	}

}