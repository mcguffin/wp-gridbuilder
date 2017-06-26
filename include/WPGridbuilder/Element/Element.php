<?php

namespace WPGridbuilder\Element;

use WPGridbuilder\Settings;


abstract class Element {
	private static $_counter = 0;
	protected $type;

	protected $grid_data;

	private $parent_element = null;

	public function __construct( $grid_data, $parent = null ) {

		self::$_counter++;

		$status_defaults = array(
			'active'	=> true,
		);
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

		$grid_data = wp_parse_args( $grid_data, $status_defaults );
		$grid_data = wp_parse_args( $grid_data, $attr_defaults );
		$grid_data = wp_parse_args( $grid_data, $bg_defaults );
		$grid_data = wp_parse_args( $grid_data, $this->get_element_defaults() );

		$this->grid_data			= $grid_data;

		$this->parent_element		= $parent;

		$this->grid_data['type']	= $this->type;
		
	}

	abstract function get_element_defaults();

	abstract function render_content( );

	protected function get_parent() {
		return $this->parent_element;
	}

	protected function getCount() {
		return self::$_counter;
	}

	/**
	 *	Generate Visibility classes like 'visible-sm' or 'hidden-lg'
	 *
	 *	@access private
	 *	@param	array	$item	any item data
	 *	@return	array
	 */
	protected function mk_visibility_classes( $item ) {
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
	protected function mk_fullscreen_classes( $item ) {
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
	protected function mk_grid_classes( $item ) {
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
	protected function mk_item_attr( $item, $attr = array() ) {
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
		}
		if ( ! empty( $item['attr_style'] ) ) {
			$attr['style'][] = trim( $item['attr_style'], " \t\n\r\0\x0B;" );
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
	protected function mk_background_classes( $item ) {
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
	protected function mk_background_styles( $item ) {
		$styles = array();
/*
		if ( $item['background_image'] && $item['background_attachment'] === 'fixed' ) {
			$img_src = wp_get_attachment_url( $item['background_image'], $item['background_image_size'] );
			$styles[ 'background-image' ] = sprintf( 'url("%s")', $img_src );
		}
*/
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
	protected function background_elements( $item ) {
		$output = '';
		$has_overlay = ( $item['background_image'] || $item['background_video'] ) && $item[ 'background_color' ];
		$has_overlay = apply_filters( 'gridbuilder_force_background_overlay', $has_overlay, $item );
		$output .= apply_filters( 'gridbuilder_before_background_elements', '', $item );
		if ( $item['background_image'] /*&& $item['background_attachment'] !== 'fixed'*/ ) {
			// attach image
			$output .= wp_get_attachment_image( $item['background_image'], 'large' );
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
		$output .= apply_filters( 'gridbuilder_after_background_elements', '', $item );
		return apply_filters( 'gridbuilder_background_elements', $output, $item );
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
	protected function mk_color( $color, $opacity = '' ) {
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
	protected function mk_attr( $attr ) {
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
	protected function implode_assoc( $assoc, $inner_glue = '=', $outer_glue = '&', $keep_numeric_keys = false ) {
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
	

	
}

