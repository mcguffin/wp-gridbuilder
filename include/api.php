<?php


function gridbuilder_screen_sizes() {
	$sizes = array(
		'size_class'	=> 'col-{{screensize}}-{{size}}',
		'offset_class'	=> 'col-{{screensize}}-offset-{{size}}',
		'hidden_class'	=> 'hidden-{{screensize}}',
		'visible_class'	=> 'visible-{{screensize}}',
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
	return apply_filters( 'gridbuilder_screen_sizes', $sizes );
}
