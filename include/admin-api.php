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
			'title'		=> __('Color', 'wp-gridbuilder'),
			'type'		=> 'color',
			'priority'	=> 5,
			'palettes'	=> false,
		),
		'background_opacity'	=> array(
			'title'		=> __('Color Opacity', 'wp-gridbuilder'),
			'type'		=> 'range',
			'min'		=> 0,
			'max'		=> 1,
			'step'		=> 0.01,
			'priority'	=> 10,
		),
		'background_image'		=> array(
			'title'			=> __('Image', 'wp-gridbuilder'),
			'type'			=> 'media',
			'mimetype'		=> 'image',
			'priority'		=> 15,
		),
		'background_size'	=> array(
			'title' 		=> __('Image Size', 'wp-gridbuilder'),
			'type' 			=> 'select',
			'options' 		=> array(
				'none'			=> __('Tiled Image', 'wp-gridbuilder'),
				'contain'		=> __('Contain', 'wp-gridbuilder'),
				'cover'			=> __('Cover', 'wp-gridbuilder'),
				'fill'			=> __('Fill (scale unproportional)', 'wp-gridbuilder'),
//				'parallax' => __('Parallax', 'wp-gridbuilder'),
//				'parallax-original' => __('Parallax (Original Size)', 'wp-gridbuilder'),
			),
			'description'	=> __('How the background image is displayed.', 'wp-gridbuilder'),
			'priority'		=> 20,
			'default'		=> 'contain',
		),
		'background_attachment'	=> array(
			'title'			=> __('Image Alignment', 'wp-gridbuilder'),
			'type' 			=> 'select',
			'options' 		=> array(
				'scroll'		=> __('Scroll', 'wp-gridbuilder'),
				'fixed'			=> __('Fixed', 'wp-gridbuilder'),
//				'parallax' => __('Parallax', 'wp-gridbuilder'),
//				'parallax-original' => __('Parallax (Original Size)', 'wp-gridbuilder'),
			),
			'description'	=> __('How the background image is displayed.', 'wp-gridbuilder'),
			'priority'		=> 20,
			'default'		=> 'scroll',
		),
		'background_position_horizontal' => array(
			'title' 	=> __('Horizontal Position', 'wp-gridbuilder'),
			'type' 		=> 'select',
			'options' 	=> array(
				'left'		=> __('Left', 'wp-gridbuilder'),
				'center'	=> __('Center', 'wp-gridbuilder'),
				'right'		=> __('Right', 'wp-gridbuilder'),
			),
			'priority' 	=> 21,
			'default'	=> 'center',
		),
		'background_position_vertical' => array(
			'title' 	=> __('Vertical Position', 'wp-gridbuilder'),
			'type' 		=> 'select',
			'options' 	=> array(
				'top' 		=> __('Top', 'wp-gridbuilder'),
				'center'	=> __('Center', 'wp-gridbuilder'),
				'bottom'	=> __('Bottom', 'wp-gridbuilder'),
			),
			'priority' 	=> 22,
			'default'	=> 'center',
		),
		'background_video'		=> array(
			'title' => __('Background Video', 'wp-gridbuilder'),
			'type' => 'media',
			'mimetype'	=> 'video',
			'priority' => 30,
		),
	);
	return apply_filters( 'gridbuilder_background_settings', $settings );
}


function _gridbuilder_grid_settings( $priority = 0 ) {
	$settings = array(
		'grid_settings'	=> array(
			'type'		=> 'matrix',
			'priority'	=> $priority,
			'rows'		=> array(
				0 => array(
					0 => array(
						'type'	=> 'label',
						'title'	=> '',
					),
				),
				1 => array(
					0 => array(
						'type'	=> 'label',
						'title'	=> __( 'Visibility', 'wp-gridbuilder' ),
					),
				),
				2 => array(
					0 => array(
						'type'	=> 'label',
						'title'	=> __( 'Size', 'wp-gridbuilder' ),
					),
				),
				3 => array(
					0 => array(
						'type'	=> 'label',
						'title'	=> __( 'Offset', 'wp-gridbuilder' ),
					),
				),
			),
		),
	);
	$sizes = gridbuilder_screen_sizes();
	foreach ( $sizes['sizes'] as $size => $size_settings ) {
		// title
		$settings['grid_settings']['rows'][ 0 ][] = array(
			'type'	=> 'label',
			'title'	=> $size_settings['name'],
		);

		// visibility
		$settings['grid_settings']['rows'][ 1 ][ 'visibility_' . $size ] = array(
			'type'		=> 'radio',
			'title'		=> false,
			'default'	=> '',
			'options'	=> array(
				''			=> __( 'Default', 'wp-gridbuilder' ),
				'visible'	=> __( 'Visible', 'wp-gridbuilder' ),
				'hidden'	=> __( 'Hidden', 'wp-gridbuilder' ),
			),
		);

		// size
		$settings['grid_settings']['rows'][ 2 ][ 'size_' . $size ] = array(
			'type'	=> 'number',
			'title'	=> false,
			'min' => 1,
			'max' => $sizes['columns'],
			'step' => 1,
		);

		// offset
		$settings['grid_settings']['rows'][ 3 ][ 'offset_' . $size ] = array(
			'type'	=> 'number',
			'title'	=> false,
			'min' => 0,
			'max' => $sizes['columns'] - 1,
			'step' => 1,
		);
	}	

	return apply_filters( 'gridbuilder_grid_settings', $settings );

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
		'tagname'		=> array(
			'title' 		=> __('Container Tag', 'wp-gridbuilder'),
			'type' 			=> 'radio',
			'options'		=> array(
				'div'			=> __('Div','wp-gridbuilder'),
				'section'		=> __('Section','wp-gridbuilder'),
				'article'		=> __('Article','wp-gridbuilder'),
			),
			'default'		=> 'div',
			'priority'		=> 5,
		),

		'fluid'			=> array(
			'title' 		=> __('Fluid', 'wp-gridbuilder'),
			'type' 			=> 'checkbox',
			'description'	=> __('If checked the container content will adapt to the screen width', 'wp-gridbuilder'),
			'priority' 		=> 20,
		),
		'fullscreen'	=> array(
			'title'			=> __('Fullscreen', 'repeatmobile-admin'),
			'description'	=> __('If checked the container will be at least one viewport high.', 'repeatmobile-admin'),
			'type'			=> 'checkbox',
			'priority'		=> 30,
		),
	
	);
	return apply_filters( 'gridbuilder_container_editor', $editor );
}
function gridbuilder_row_editor() {
	$editor = array(
		'fullscreen'	=> array(
			'title'			=> __('Fullscreen', 'repeatmobile-admin'),
			'description'	=> __('If checked the container will be at least one viewport high.', 'repeatmobile-admin'),
			'type'			=> 'checkbox',
			'priority'		=> 0,
		),
	);
	return apply_filters( 'gridbuilder_row_editor', $editor );
}
function gridbuilder_cell_editor() {
	$editor = _gridbuilder_grid_settings( 10 ) + array(
		'fullscreen'	=> array(
			'title'			=> __('Fullscreen', 'repeatmobile-admin'),
			'description'	=> __('If checked the container will be at least one viewport high.', 'repeatmobile-admin'),
			'type'			=> 'checkbox',
			'priority'		=> 0,
		),
	);
	return apply_filters( 'gridbuilder_cell_editor', $editor );
}
function gridbuilder_widget_editor() {
	$editor = _gridbuilder_grid_settings( 100 ) + array(
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



