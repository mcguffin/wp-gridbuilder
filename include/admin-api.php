<?php

function gridbuilder_container_templates() {
	return apply_filters( 'gridbuilder_container_templates', get_option( 'gridbuilder_container_templates', (object) array() ) );
}

function gridbuilder_row_templates() {
	return apply_filters( 'gridbuilder_row_templates', get_option( 'gridbuilder_row_templates', (object) array() ) );
}

function gridbuilder_cell_templates() {
	return apply_filters( 'gridbuilder_cell_templates', get_option( 'gridbuilder_cell_templates', (object) array() ) );
}

function gridbuilder_widget_templates() {
	return apply_filters( 'gridbuilder_widget_templates', get_option( 'gridbuilder_widget_templates', (object) array() ) );
}

function _gridbuilder_attributes_settings() {
	$settings = array(
		'attr_id'	=> array(
			'title' => __('ID', 'wp-gridbuilder'),
			'type' => 'text',
			'description' => __('A custom ID.', 'wp-gridbuilder'),
			'priority' => 5,
		),
		'attr_class'	=> array(
			'title' => __('Classname', 'wp-gridbuilder'),
			'type' => 'text',
			'description' => __('A CSS classname', 'wp-gridbuilder'),
			'priority' => 10,
		),
		'attr_style'	=> array(
			'title' => __('Custom CSS', 'wp-gridbuilder'),
			'type' => 'textarea',
			'priority' => 15,
		),
	);
	return apply_filters( 'gridbuilder_attributes_settings', $settings );
}
function _gridbuilder_background_settings() {
	$settings = array(
		'background_color'		=> array(
			'title'		=> __('Background Color', 'wp-gridbuilder'),
			'type'		=> 'color',
			'priority'	=> 5,
			'palettes'	=> false,
		),
		'background_opacity'	=> array(
			'title'		=> __('Background Color Opacity', 'wp-gridbuilder'),
			'type'		=> 'range',
			'min'		=> 0,
			'max'		=> 1,
			'step'		=> 0.01,
			'priority'	=> 10,
		),
		'background_image'		=> array(
			'title' => __('Background Image', 'wp-gridbuilder'),
			'type' => 'media',
			'mimetype'	=> 'image',
			'priority' => 15,
		),
		'background_alignment'	=> array(
			'title' => __('Background Image Alignment', 'wp-gridbuilder'),
			'type' => 'select',
			'options' => array(
				'tile' => __('Tiled Image', 'wp-gridbuilder'),
				'center' => __('Centered, with original size', 'wp-gridbuilder'),
				'cover' => __('Cover', 'wp-gridbuilder'),
				'fixed' => __('Fixed', 'wp-gridbuilder'),
//				'parallax' => __('Parallax', 'wp-gridbuilder'),
//				'parallax-original' => __('Parallax (Original Size)', 'wp-gridbuilder'),
			),
			'description' => __('How the background image is displayed.', 'wp-gridbuilder'),
			'priority' => 20,
		),
		'background_video'		=> array(
			'title' => __('Background Video', 'wp-gridbuilder'),
			'type' => 'media',
			'mimetype'	=> 'video',
			'priority' => 25,
		),
	);
	return apply_filters( 'gridbuilder_background_settings', $settings );
}

function gridbuilder_container_settings() {
	$settings = array(
		'attributes'	=> array(
			'title'			=> __( 'Attributes','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_attributes_settings(),
		),
		'background'	=> array(
			'title'			=> __( 'Background','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_background_settings(),
		), 
	);
	return apply_filters( 'gridbuilder_container_settings', $settings );
}

function gridbuilder_row_settings() {
	$settings = array(
		'attributes'	=> array(
			'title'			=> __( 'Attributes','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_attributes_settings(),
		),
		'background'	=> array(
			'title'			=> __( 'Background','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_background_settings(),
		), 
	);
	return apply_filters( 'gridbuilder_row_settings', $settings );
}

function gridbuilder_cell_settings() {
	$settings = array(
		'attributes'	=> array(
			'title'			=> __( 'Attributes','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_attributes_settings(),
		),
		'background'	=> array(
			'title'			=> __( 'Background','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_background_settings(),
		), 
	);
	return apply_filters( 'gridbuilder_cell_settings', $settings );
}

function gridbuilder_widget_settings() {
	$settings = array(
		'attributes'	=> array(
			'title'			=> __( 'Attributes','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_attributes_settings(),
		),
		'background'	=> array(
			'title'			=> __( 'Background','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> _gridbuilder_background_settings(),
		), 
		'widget'		=> array(
			'title'			=> __( 'Widget','wp-gridbuilder' ),
			'description'	=> '',
			'items'			=> array(
				'before_widget'	=> array(
					'title' => __('Before Widget', 'wp-gridbuilder'),
					'type' => 'text',
					'priority' => 5,
				),
				'after_widget'	=> array(
					'title' => __('After Widget', 'wp-gridbuilder'),
					'type' => 'text',
					'priority' => 10,
				),
				'before_title'	=> array(
					'title' => __('Before Title', 'wp-gridbuilder'),
					'type' => 'text',
					'priority' => 5,
				),
				'after_title'	=> array(
					'title' => __('After Title', 'wp-gridbuilder'),
					'type' => 'text',
					'priority' => 10,
				),
				
			),
		),
	);
	return apply_filters( 'gridbuilder_widget_settings', $settings );
}



function gridbuilder_container_editor() {
	$editor = array(
		'tagname'	=> array(
			'title' => __('Container Tag', 'wp-gridbuilder'),
			'type' => 'radio',
			'options'	=> array(
				'div'		=> __('Div','wp-gridbuilder'),
				'section'	=> __('Section','wp-gridbuilder'),
				'article'	=> __('Article','wp-gridbuilder'),
			),
			'default'	=> 'div',
			'priority' => 5,
		),

		'fluid'	=> array(
			'title' => __('Fluid', 'wp-gridbuilder'),
			'type' => 'checkbox',
			'description' => __('If checked the container content will adapt to the screen width', 'wp-gridbuilder'),
			'priority' => 20,
		),
	);
	return apply_filters( 'gridbuilder_container_editor', $editor );
}
function gridbuilder_row_editor() {
	$editor = array();
	return apply_filters( 'gridbuilder_row_editor', $editor );
}
function gridbuilder_cell_editor() {
	$editor = array(
		'size_lg'	=> array(
			'title' => __('Cell size desktop', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 1,
			'max' => 12,
			'step' => 1,
			'priority' => 5,
		),
		'size_md'	=> array(
			'title' => __('Cell size tablet landscape', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 1,
			'max' => 12,
			'step' => 1,
			'priority' => 10,
		),
		'size_sm'	=> array(
			'title' => __('Cell size tablet portrait', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 1,
			'max' => 12,
			'step' => 1,
			'priority' => 15,
		),
		'size_xs'	=> array(
			'title' => __('Cell size phone', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 1,
			'max' => 12,
			'step' => 1,
			'priority' => 20,
		),

		'offset_lg'	=> array(
			'title' => __('Cell offset desktop', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 0,
			'max' => 11,
			'step' => 1,
			'priority' => 25,
		),
		'offset_md'	=> array(
			'title' => __('Cell offset tablet landscape', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 0,
			'max' => 11,
			'step' => 1,
			'priority' => 30,
		),
		'offset_sm'	=> array(
			'title' => __('Cell offset tablet portrait', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 0,
			'max' => 11,
			'step' => 1,
			'priority' => 35,
		),
		'offset_xs'	=> array(
			'title' => __('Cell offset phone', 'wp-gridbuilder'),
			'type' => 'number',
			'min' => 0,
			'max' => 11,
			'step' => 1,
			'priority' => 40,
		),
	);
	return apply_filters( 'gridbuilder_cell_editor', $editor );
}
function gridbuilder_widget_editor() {
	$editor = array(
		'instance'	=> array(
			'type'	=> 'widget_instance',
			'priority'	=> 10,
		),
	);
	return apply_filters( 'gridbuilder_widget_editor', $editor );
}

function gridbuilder_widget_types() {
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
