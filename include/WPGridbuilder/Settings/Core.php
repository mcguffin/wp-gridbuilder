<?php


namespace WPGridbuilder\Settings;

class Core {
	/**
	 *	Screen sizes setup
	 *
	 *	@return	assoc
	 */
	public static function screen_sizes() {
		$sizes = array(
			'size_class'	=> 'col-{{screensize}}-{{size}}',
			'offset_class'	=> 'col-{{screensize}}-offset-{{size}}',
			'hidden_class'	=> 'hidden-{{screensize}}',
			'visible_class'	=> 'visible-{{screensize}}',
			'columns'		=> 12,
			'sizes'	=> array(
				'xs'	=> array(
					'name'	=> __( 'Smartphone', 'wp-gridbuilder' ),
					'icon'	=> 'dashicons dashicons-smartphone',
				),
				'sm'	=> array(
					'name'	=> __( 'Tablet', 'wp-gridbuilder' ),
					'icon'	=> 'dashicons dashicons-tablet',
				),
				'md'	=> array(
					'name'	=> __( 'Tablet (landscape)', 'wp-gridbuilder' ),
					'icon'	=> 'dashicons dashicons-tablet rotate-right',
				),
				'lg'	=> array(
					'name'	=> __( 'Desktop', 'wp-gridbuilder' ),
					'icon'	=> 'dashicons dashicons-desktop',
				),
			),
		);
		/**
		 *	Filter for screensizes used by Gridbuilder.
		 *	
		 *
		 *	@param	assoc	$sizes	array(
		 *								'size_class'	: Size classname template.
		 *												  Uses placeholders {{screensize}} and {{size}}
		 *												  Default `col-{{screensize}}-{{size}}`
		 *								'offset_class'	: Offset classname template.
		 *												  Uses placeholders {{screensize}} and {{size}}
		 *												  Default `col-{{screensize}}-offset-{{size}}`
		 *								'hidden_class'	: Hidden classname template.
		 *												  Uses placeholders {{screensize}}
		 *												  Default `hidden-{{screensize}}`
		 *								'visible_class'	: Visible classname template.
		 *												  Uses placeholder {{screensize}}
		 *												  Default `visible-{{screensize}}`
		 *								'columns'		: Number of columns. 
		 *								'sizes'			: assoc screensizes you want to consider.
		 *							)
		 */
		return apply_filters( 'gridbuilder_screen_sizes', $sizes );
	}

}