<?php

namespace WPGridbuilder;

class Core {
	private static $_instance = null;

	/**
	 * Getting a singleton.
	 *
	 * @return object single instance of Gridbuilder
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) )
			self::$_instance = new self();
		return self::$_instance;
	}

	/**
	 *	Prevent Instantinating
	 */
	private function __clone() { }
	private function __wakeup() { }

	/**
	 *	Private constructor
	 */
	private function __construct() {
		add_action( 'plugins_loaded' , array( &$this , 'load_textdomain' ) );
		add_action( 'init' , array( &$this , 'init' ) );
		add_action( 'wp_enqueue_scripts' , array( &$this , 'wp_enqueue_style' ) );

		register_activation_hook( PLUGIN_FILE, array( __CLASS__ , 'activate' ) );
		register_deactivation_hook( PLUGIN_FILE, array( __CLASS__ , 'deactivate' ) );
		register_uninstall_hook( PLUGIN_FILE, array( __CLASS__ , 'uninstall' ) );
		
		add_filter( 'the_content', array( $this,'the_content' ) );
	}
	
	/**
	 *	Load frontend styles and scripts
	 *
	 *	@action wp_enqueue_scripts
	 */
	function wp_enqueue_style() {
		if ( get_option( 'gridbuilder_frontend_enqueue_bootstrap' ) ) {
			wp_enqueue_style( 'gridbuilder-frontend', plugins_url( 'css/frontend-bootstrap.css', PLUGIN_FILE ) );
			wp_enqueue_script( 'bootstrap', plugins_url( 'js/bootstrap/bootstrap.min.js', PLUGIN_FILE ), array( 'jquery' ) );
		} else {
			wp_enqueue_style( 'gridbuilder-frontend', plugins_url( 'css/frontend.css', PLUGIN_FILE ) );
		}
	}
	
	/**
	 *	Output Grid generated HTML
	 *
	 *	@filter the_content
	 */
	public function the_content( $the_content ) {
		if ( get_post_meta( get_the_ID(), '_grid_enabled', true )  && ( $grid_data = get_post_meta( get_the_ID(), '_grid_data', true ) ) ) {
			return $this->get_content( $grid_data );
		}
		return $the_content;
	}
	
	/**
	 *	Returns Grid HTML
	 *	
	 *	@param array $grid_data
	 *	@return	string	Grid HTML
	 */
	public function get_content( $grid_data ) {
		global $wp_widget_factory;
		$output = '';
		$attr_defaults = array(
			'attr_id'		=> '',
			'attr_class'	=> '',
			'attr_style'	=> '',
		);
		$bg_defaults = array(
			'background_color'					=> '',
			'background_opacity'				=> '',
			'background_image'					=> '',
			'background_image_size'				=> 'large',
			'background_video'					=> '',
			'background_size'					=> 'cover',
			'background_attachment'				=> 'scroll',
			'background_position_horizontal'	=> 'center',
			'background_position_vertical'		=> 'center',
		);
		$container_defaults = array(
			'title'			=> '',
			'subtitle'		=> '',
			'fluid'			=> false,
			'tagname'		=> 'div',
			'fullscreen'	=> false,
		);
		$row_defaults = array(
			'fullscreen'	=> false,
		);
		$cell_defaults = array(
			'fullscreen'	=> false,
		);
		$widget_defaults = array(
			'widget_class'	=> false,
			'instance'		=> array(),
		);
		$widget_args_defaults = array(
			'before_widget'	=> false,
			'after_widget'	=> false,
			'before_title'	=> false,
			'after_title'	=> false,
		);
		foreach ( $grid_data['items'] as $container ) {
			$container = wp_parse_args( $container, $attr_defaults );
			$container = wp_parse_args( $container, $bg_defaults );
			$container = wp_parse_args( $container, $container_defaults );
			
			// container wrap
			$container_wrap_attr = array(
				'id'	=> $container['attr_id'],
				'class'	=> array_merge( 
						array( 'container-wrap', $container['attr_class'] ), 
						$this->mk_fullscreen_classes( $container )
				),
			);
			$container_wrap_attr = $this->mk_item_attr( $container, $container_wrap_attr );
			$container_wrap_attr = apply_filters( 'gridbuilder_container_wrapper_attr', $container_wrap_attr, $container );

			$output .= sprintf( '<%s %s>', $container['tagname'], $this->mk_attr( $container_wrap_attr ) );

			// container bg elements
			$output .= $this->background_elements( $container );
			
			$output .= apply_filters( 'gridbuilder_before_container', '', $container );
			// container 
			$container_attr = array(
				'class'	=> $container['fluid'] ? 'container-fluid' : 'container',
			);
			$container_attr = apply_filters( 'gridbuilder_container_attr', $container_attr, $container );

			$output .= sprintf( '<div %s>', $this->mk_attr( $container_attr ) );
			$output .= apply_filters( 'gridbuilder_inside_container_before', '', $container );

			foreach ( $container['items'] as $row ) {
				$row = wp_parse_args( $row, $attr_defaults );
				$row = wp_parse_args( $row, $bg_defaults );
				$row = wp_parse_args( $row, $row_defaults );
				$row_attr = array(
					'id'	=> $row['attr_id'],
					'class'	=> array_merge( 
						array( 'row', $row['attr_class'] ), 
						$this->mk_fullscreen_classes( $row )
					),
				);
				$row_attr = $this->mk_item_attr( $row, $row_attr );
				$row_attr = apply_filters( 'gridbuilder_row_attr', $row_attr, $row, $container );

				$output .= sprintf( '<div %s>', $this->mk_attr( $row_attr ) );
				$output .= $this->background_elements( $row );

				foreach ( $row['items'] as $cell ) {
					$cell = wp_parse_args( $cell, $attr_defaults );
					$cell = wp_parse_args( $cell, $bg_defaults );
					$cell = wp_parse_args( $cell, $cell_defaults );
					$cell_attr = array(
						'id'	=> $cell['attr_id'],
						'class'	=> array_merge(  
							array( 'cell', $cell['attr_class'] ),
							$this->mk_grid_classes( $cell ),
							$this->mk_fullscreen_classes( $cell )
						),
					);

					$cell_attr = $this->mk_item_attr( $cell, $cell_attr );
					$cell_attr = apply_filters( 'gridbuilder_cell_attr', $cell_attr, $cell, $row, $container );
					$output .= sprintf( '<div %s>', $this->mk_attr( $cell_attr ) );
					$output .= $this->background_elements( $cell );

					foreach ( $cell['items'] as $widget ) {
						$widget = wp_parse_args( $widget, $attr_defaults );
						$widget = wp_parse_args( $widget, $bg_defaults );
						$widget = wp_parse_args( $widget, $widget_defaults );
						$widget = wp_parse_args( $widget, $widget_args_defaults );
						if ( isset( $wp_widget_factory->widgets[ $widget['widget_class'] ] ) ) {
							$wp_widget = $wp_widget_factory->widgets[ $widget['widget_class'] ];
							$widget_attr = array(
								'id'	=> $row['attr_id'],
								'class'	=> array_merge( 
									array( 'widget', 'widget-'.$wp_widget->id_base, $widget['attr_class'] ), 
									$this->mk_grid_classes( $widget )
								),
							);
							$widget_attr = $this->mk_item_attr( $widget, $widget_attr );
							$widget_attr = apply_filters( 'gridbuilder_widget_attr', $widget_attr, $widget, $cell, $row, $container );
							$output .= sprintf( '<div %s>', $this->mk_attr( $widget_attr ) );
							$output .= $this->background_elements( $widget );

							ob_start();
							$wp_widget->widget( $widget, $widget['instance'] );
							$output .= ob_get_clean();
							$output .= '</div>'; // end widget
						}
					}
					$output .= '</div>'; // end cell
				}

				$output .= '</div>'; // end row
			}

			$output .= apply_filters( 'gridbuilder_inside_container_after', '', $container );
			$output .= '</div>'; // end container
			$output .= apply_filters( 'gridbuilder_after_container', '', $container );
			$output .= sprintf( '</%s>', $container['tagname'] ); // end container wrapper
		}
		return $output;
	}
	
	/**
	 *	Generate Visibility classes like 'visible-sm' or 'hidden-lg'
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@return	array
	 */
	private function mk_visibility_classes( $item ) {
		$screensizes = Settings\Core::screen_sizes();
		$classes = array();
		foreach ( array_keys( $screensizes['sizes'] ) as $size ) {
			if ( isset( $item[ 'visibility_' . $size ] ) ) {
				$vis = $item[ 'visibility_' . $size ];
				if ( $vis === 'hidden' ) {
					$classes[] = str_replace( 
						'{{screensize}}', 
						$size, 
						$screensizes['hidden_class'] 
					);
				} else if ( $vis === 'visible' ) {
					$classes[] = str_replace( 
						'{{screensize}}', 
						$size, 
						$screensizes['visible_class'] 
					);
				}
			}
		}
		return $classes;
	}
	
	/**
	 *	Generate Fullscreen class
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@return	array
	 */
	private function mk_fullscreen_classes( $item ) {
		$classes = array();
		if ( $item['fullscreen'] ) {
			$classes[] = 'fullscreen';
		}
		return $classes;
	}
	
	/**
	 *	Generate Grid- and Offset classes
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@return	array
	 */
	private function mk_grid_classes( $item ) {
		$screensizes = Settings\Core::screen_sizes();
		$classes	= array();
		$prev_size = 0;
		$prev_offset = 0;
		foreach ( array_keys( $screensizes['sizes'] ) as $size ) {
			$size_prop = 'size_'.$size;
			if ( isset( $item[ $size_prop ] ) && is_numeric( $item[ $size_prop ] )  && $prev_size != $item[ $size_prop ] ) {
				$classes[] = str_replace( 
					array( '{{screensize}}', '{{size}}' ), 
					array( $size, $item[ $size_prop ]), 
					$screensizes['size_class'] 
				);
				$prev_size = $item[ $size_prop ];
			}

			$offset_prop = 'offset_'.$size;
			if ( isset( $item[ $offset_prop ] ) && is_numeric( $item[ $offset_prop ] ) && $prev_offset != $item[ $offset_prop ] ) {
				$classes[] = str_replace( 
					array( '{{screensize}}', '{{size}}' ), 
					array( $size, $item[ $offset_prop ] ), 
					$screensizes['offset_class'] 
				);
				$prev_offset = $item[ $offset_prop ];
			}

		}
		return $classes;
	}
	
	/**
	 *	Make item attributes
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@param	array	$attr	attributes so far
	 *	@return assoc
	 */
	private function mk_item_attr( $item, $attr = array() ) {
		if ( $item['background_image'] || $item['background_video'] || $item['background_color'] ) {
			$classes = array();
			$attr = wp_parse_args( $attr, array(
				'class'	=> array(),
			) );
			$attr['class'] = array_merge(
				(array) $attr['class'],
				$this->mk_visibility_classes( $item ),
				$this->mk_background_classes( $item )
			);
			$attr['style'] = $this->mk_background_styles( $item );
			if ( ! empty( $item['attr_style'] ) ) {
				$attr['style'][] = trim( $item['attr_style'], " \t\n\r\0\x0B;" );
			}
		}
		return $attr;
	}
	/**
	 *	Return background classnames
	 *
	 *	@access private
	 *	@param array $item any item data
	 *	@return array
	 */
	private function mk_background_classes( $item ) {
		$classes = array();
		if ( $item['background_image'] ) {
			$classes[] = 'background-image-container';
		}
		if ( $item['background_video'] ) {
			$classes[] = 'background-video-container';
		}

		if ( $item['background_image'] || $item['background_video'] ) {
			$classes[] = 'background-size-' . $item['background_size'];
			$classes[] = 'background-attachment-' . $item['background_attachment'];
			$classes[] = 'background-position-' . $item['background_position_horizontal'] . '-' . $item['background_position_vertical'];
		}
		return $classes;
	}
/*
			'background_size'					=> '',
			'background_attachment'				=> '',
			'background_position_horizontal'	=> '',
			'background_position_vertical'		=> '',

*/

	/**
	 *	Return background styles
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@return assoc
	 */
	private function mk_background_styles( $item ) {
		$styles = array();
		if ( $item['background_image'] && $item['background_attachment'] === 'fixed' ) {
			$img_src = wp_get_attachment_url( $item['background_image'], $item['background_image_size'] );
			$styles[ 'background-image' ] = sprintf( 'url("%s")', $img_src );
		}
		if ( $item[ 'background_color' ] ) {
			$color = $this->mk_color( $item[ 'background_color' ], $item[ 'background_opacity' ] );
			$styles[ 'background-color' ] = $color;
		}
		return $styles;
	}

	/**
	 *	Return background Elements HTML
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@return string
	 */
	private function background_elements( $item ) {
		$output = '';
		$has_overlay = ( $item['background_image'] || $item['background_video'] ) && $item[ 'background_color' ];
		$has_overlay = apply_filters( 'gridbuilder_force_background_overlay', $has_overlay, $item );
		if ( $item['background_image'] && $item['background_attachment'] !== 'fixed' ) {
			// attach image
			$output .= wp_get_attachment_image( $item['background_image'], 'full' );
		}
/*
image
-------
video
-------
color overlay
*/
		if ( $item['background_video'] ) {
			if ( $item[ 'background_video' ] ) {
				add_filter('wp_video_shortcode', array( $this, 'wp_video_shortcode_rm_controls' ), 10, 5 );
				$mp4_src = wp_get_attachment_url( $item['background_video'] );
				if ( $mp4_src ) {
					$output .= do_shortcode( sprintf('[video src="%s" autoplay="on" loop="on" class="background-overlay" width="0"]', $mp4_src ) ); // video...
					remove_filter('wp_video_shortcode', array( $this, 'wp_video_shortcode_rm_controls' ), 10 );
				}
			}
		}
		if ( $has_overlay ) {
			$overlay_atts = array(
				'class'	=> 'background-overlay',
				'style'	=> array('background-color' => $this->mk_color( $item[ 'background_color' ], $item[ 'background_opacity' ] ) ),
			);
			$overlay_atts = apply_filters( 'gridbuilder_background_overlay_attr', $overlay_atts, $item );
			$output .= sprintf('<div %s></div>', 
				 $this->mk_attr( $overlay_atts )
			);
		}
		return $output;
	}
	/**
	 *	Remove `controls` attibute from wp-video shortcode.
	 *
	 *	@filter wp_video_shortcode
	 *	@return html wp video shortcode without controls
	 */
	public function wp_video_shortcode_rm_controls( $output, $atts, $video, $post_id, $library ) {
		$output = str_replace( 'controls="controls"', '', $output );
		return $output;
	}
	/**
	 *	Make css compliant color value.
	 *	
	 *	@access private
	 *	@param	string	$color		Hex color value
	 *	@param	mixed	$opacity	Opacity value as float or empty string
	 *
	 *	@return string 'rgba(r,g,b,a)' or #rrggbb
	 */
	private function mk_color( $color, $opacity = '' ) {
		$op = floatval($opacity);
		if ( $opacity === '' || $op == 1 ) {
			return $color;
		}
		$color = intval( str_replace('#','',$color), 16 );

		$b = $color % 256;
		$g = ($color >> 8) % 256;
		$r = ($color >> 16) % 256;
		
		return sprintf( 'rgba(%d,%d,%d,%s)', $r, $g, $b, strval($op) );
	}

	/**
	 *	Make HTML attributes
	 *
	 *	@access private
	 *	@param	assoc	$attr
	 *
	 *	@return	string
	 */
	private function mk_attr( $attr ) {
		$output = '';
		foreach ( $attr as $key => $value ) {
			if ( $value !== false && $value !== '' ) {
				if ( is_array( $value ) ) {
					switch ( $key ) {
						case 'class':
							$value = $this->implode_assoc( array_values( $value ), '', ' ' );
							break;
						case 'style':
							$value = $this->implode_assoc( $value, ':', ';' );
							break;
						default:
							$value = $this->implode_assoc( $value );
							break;
					}
				}
				$output .= sprintf(' %s="%s"', sanitize_title($key), esc_attr($value) );
			}
		}
		return $output;
	}

	/**
	 *	Reduce assoc to string.
	 *	Use for query strings, style attributes and such.
	 *
	 *	@access private
	 *	@param	assoc	$assoc
	 *	@param	string	$inner_glue			
	 *	@param	string	$outer_glue			
	 *	@param	bool	$keep_numeric_keys	How to handle numeric keys. 
	 *
	 *	@return string
	 */
	private function implode_assoc( $assoc, $inner_glue = '=', $outer_glue = '&', $keep_numeric_keys = false ) {
		$arr = array();
		foreach ( $assoc as $key => $value ) {
			if ( ! is_null( $value ) && $value !== '' ) {
				if ( ! $keep_numeric_keys && is_numeric( $key ) ) {
					$arr[] = $value;
				} else {
					$arr[] = $key . $inner_glue . $value;
				}
			}
		}
		return implode( $outer_glue, $arr );
	}
	
	/**
	 *	Load text domain
	 * 
	 *  @action plugins_loaded
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'wp-gridbuilder' , false, PLUGIN_DIRECTORY . '/languages/' );
	}

	/**
	 *	Init hook.
	 * 
	 *  @action init
	 */
	function init() {
	}



	/**
	 *	Fired on plugin activation
	 */
	public static function activate() {
	
	
	}

	/**
	 *	Fired on plugin deactivation
	 */
	public static function deactivate() {
	}
	/**
	 *	Fired on plugin deinstallation
	 */
	public static function uninstall(){
		delete_option( 'gridbuilder_container_templates');
		delete_option( 'gridbuilder_row_templates' );
		delete_option( 'gridbuilder_cell_templates' );
		delete_option( 'gridbuilder_widget_templates' );
		delete_option( 'gridbuilder_frontend_enqueue_bootstrap' );
	}

}
