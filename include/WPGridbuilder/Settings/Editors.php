<?php


namespace WPGridbuilder\Settings;

class Editors {
	
	public static function container() {
		$ret = array(
			'main'		=> self::prioritySortEditor( self::container_main() ),
			'sidebar'	=> self::prioritySortSettings( self::container_sidebar() ),
		);

		return $ret;
	}

	private static function container_sidebar() {
		$settings = array(
			'status'	=> array(
				'title'			=> __( 'Status','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::status_settings(),
			),
			'attributes'	=> array(
				'title'			=> __( 'Attributes','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::attributes_settings(),
			),
			'background'	=> array(
				'title'			=> __( 'Background','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::background_settings(),
			), 
		);
		return apply_filters( 'gridbuilder_container_settings', $settings );
	}

	private static function container_main() {
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

	

	public static function row() {
		$ret = array(
			'main'		=> self::prioritySortEditor( self::row_main() ),
			'sidebar'	=> self::prioritySortSettings( self::row_sidebar() ),
		);

		return $ret;
	}


	private static function row_sidebar() {
		$settings = array(
			'status'	=> array(
				'title'			=> __( 'Status','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::status_settings(),
			),
			'attributes'	=> array(
				'title'			=> __( 'Attributes','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::attributes_settings(),
			),
			'background'	=> array(
				'title'			=> __( 'Background','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::background_settings(),
			), 
		);
		return apply_filters( 'gridbuilder_row_settings', $settings );
	}

	private static function row_main() {
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



	public static function cell() {
		$ret = array(
			'main'		=> self::prioritySortEditor( self::cell_main() ),
			'sidebar'	=> self::prioritySortSettings( self::cell_sidebar() ),
		);
		return $ret;
	}



	private static function cell_sidebar() {
		$settings = array(
			'status'	=> array(
				'title'			=> __( 'Status','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::status_settings(),
			),
			'attributes'	=> array(
				'title'			=> __( 'Attributes','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::attributes_settings(),
			),
			'background'	=> array(
				'title'			=> __( 'Background','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::background_settings(),
			), 
		);
		return apply_filters( 'gridbuilder_cell_settings', $settings );
	}

	private static function cell_main() {
		$editor = self::grid_settings( 10 ) + array(
			'fullscreen'	=> array(
				'title'			=> __('Fullscreen', 'repeatmobile-admin'),
				'description'	=> __('If checked the container will be at least one viewport high.', 'repeatmobile-admin'),
				'type'			=> 'checkbox',
				'priority'		=> 0,
			),
		);
		return apply_filters( 'gridbuilder_cell_editor', $editor );
	}

	public static function widget() {
		$ret = array(
			'main'		=> self::prioritySortEditor( self::widget_main() ),
			'sidebar'	=> self::prioritySortSettings( self::widget_sidebar() ),
		);
		return $ret;
	}


	private static function widget_sidebar() {
		$settings = array(
			'status'	=> array(
				'title'			=> __( 'Status','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::status_settings(),
			),
			'attributes'	=> array(
				'title'			=> __( 'Attributes','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::attributes_settings(),
			),
			'background'	=> array(
				'title'			=> __( 'Background','wp-gridbuilder' ),
				'description'	=> '',
				'items'			=> self::background_settings(),
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

	private static function widget_main() {
		$editor = self::grid_settings( 100 ) + array(
			'instance'	=> array(
				'type'	=> 'widget_instance',
				'priority'	=> 10,
			),
		);
		return apply_filters( 'gridbuilder_widget_editor', $editor );
	}





	//	--------------------------------------------- 
	//	Atomic settings
	//	--------------------------------------------- 

	/**
	 *	HTML Element attribtues id, class, style
	 */
	private static function status_settings() {
		$settings = array(
			'active'	=> array(
				'title'			=> __('Active', 'wp-gridbuilder'),
				'type'			=> 'checkbox',
				'description'	=> '',
				'priority'		=> 5,
				'default'		=> true,
			),
		);
		return apply_filters( 'gridbuilder_status_settings', $settings );
	}


	/**
	 *	HTML Element attribtues id, class, style
	 */
	private static function attributes_settings() {
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

	/**
	 *	Element background
	 */
	private static function background_settings() {
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


	/**
	 *	Element grid properties. visibility, colsize, offset
	 */
	private static function grid_settings( $priority = 0 ) {
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
		$sizes = Core::screen_sizes();
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




	/**
	 *	Sort an array of assocs by key `priority`
	 *
	 *	@private
	 *	@return	array
	 */
	private static function prioritySortEditor( $arr ) {
		uasort( $arr, array( __CLASS__, 'prioritySort' ) );
		return $arr;
	}
	/**
	 *	Sort an array of arrays of assocs by key `priority`
	 *
	 *	@private
	 *	@return	array
	 */
	private static function prioritySortSettings( $arr ) {
		foreach ( array_keys($arr) as $k ) {
			 $arr[$k]['items'] = self::prioritySortEditor( $arr[$k]['items'] );
		}
		return $arr;
	}

	/**
	 *	Sort callback
	 *
	 *	@private
	 *	return int
	 */
	private static function prioritySort( $a, $b ) {
		return $a['priority'] - $b['priority'];
	}

	
}