<?php

/*
Plugin Name: WP GridBuilder
Plugin URI: http://wordpress.org/
Description: Enter description here.
Author: Jörn Lund
Version: 0.1.0
Author URI: 
License: GPL3

Text Domain: wp-gridbuilder
Domain Path: /languages/
*/

/*  Copyright 2016  Jörn Lund

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
Plugin was generated by WP Plugin Scaffold
https://github.com/mcguffin/wp-plugin-scaffold
Command line args were: `"WP GridBuilder" admin admin_css admin_js settings`
*/

if ( ! class_exists( 'Gridbuilder' ) ):
class Gridbuilder {
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
	 *	Private constructor
	 */
	private function __construct() {
		add_action( 'plugins_loaded' , array( &$this , 'load_textdomain' ) );
		add_action( 'init' , array( &$this , 'init' ) );

		register_activation_hook( __FILE__ , array( __CLASS__ , 'activate' ) );
		register_deactivation_hook( __FILE__ , array( __CLASS__ , 'deactivate' ) );
		register_uninstall_hook( __FILE__ , array( __CLASS__ , 'uninstall' ) );
		
		add_filter( 'the_content', array( $this,'the_content' ) );
	}
	
	/**
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
			'background_color'		=> '',
			'background_opacity'	=> '',
			'background_image'		=> '',
			'background_alignment'	=> '',
			'background_video'		=> '',
		);
		$container_defaults = array(
			'title'		=> '',
			'subtitle'	=> '',
			'fluid'		=> false,
			'tagname'	=> 'div',
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
				'class'	=> implode(' ', array_merge( 
					array(
						'container-wrap', 
						$container['attr_class'] ), 
						$this->mk_visibility_classes( $container ),
						$this->mk_background_classes( $container )
					) 
				),
				'style'	=> $this->background_style_attr( $container, 'container' ),
			);
			$container_wrap_attr = apply_filters( 'gridbuilder_container_wrapper_attr', $container_wrap_attr, $container );

			$output .= sprintf( '<%s %s>',$container['tagname'], $this->mk_attr( $container_wrap_attr ) );

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
				$row_attr = array(
					'id'	=> $row['attr_id'],
					'class'	=> implode(' ', array_merge( 
						array( 
							'row', 
							$row['attr_class'] ), 
							$this->mk_visibility_classes( $row ),
							$this->mk_background_classes( $row )
						) 
					),
					'style'	=> $this->background_style_attr( $row, 'row' ),
				);
				$row_attr = apply_filters( 'gridbuilder_row_attr', $row_attr, $row, $container );
				$output .= sprintf( '<div %s>', $this->mk_attr( $row_attr ) );
				$output .= $this->background_elements( $row );

				foreach ( $row['items'] as $cell ) {
					$cell = wp_parse_args( $cell, $attr_defaults );
					$cell = wp_parse_args( $cell, $bg_defaults );
					$cell_attr = array(
						'id'	=> $cell['attr_id'],
						'class'	=> implode( ' ',array_merge(  
							array( 
								'cell', 
								$cell['attr_class'] 
							), 
							$this->mk_visibility_classes( $cell ),
							$this->mk_cell_grid_classes( $cell ),
							$this->mk_background_classes( $cell )
						)),
						'style'	=> $this->background_style_attr( $cell, 'cell' ),
					);

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
							$widget_classes = array( 'widget', 'widget-'.$wp_widget->id_base, $widget['attr_class'] );
							$widget_classes = implode(' ', array_merge( 
								$widget_classes, 
								$this->mk_visibility_classes( $widget ) ,
								$this->mk_background_classes( $widget )
							) );
							$widget_attr = array(
								'id'	=> $row['attr_id'],
								'class'	=> $widget_classes,
								'style'	=> $this->background_style_attr( $widget, 'widget' ),
							);
							$widget_attr = apply_filters( 'gridbuilder_widget_attr', $widget_attr, $widget, $cell, $row, $container );
							$output .= sprintf( '<div %s>', $this->mk_attr( $widget_attr ) );
							$output .= $this->background_elements( $widget );

							ob_start();
							$wp_widget->widget( $widget, $widget['instance'] );
							$output .= ob_get_clean();
						}

						$output .= '</div>'; // end widget
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
	 *	@private
	 *	@param array $item any item data
	 */
	private function mk_visibility_classes( $item ) {
		$screensizes = gridbuilder_screen_sizes();
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
	 *	@private
	 *	@param array $cell_data
	 */
	private function mk_cell_grid_classes( $cell ) {
		$screensizes = gridbuilder_screen_sizes();
		$classes	= array();
		$prev_size = 0;
		$prev_offset = 0;
		foreach ( array_keys( $screensizes['sizes'] ) as $size ) {
			$size_prop = 'size_'.$size;
			if ( isset( $cell[ $size_prop ] ) && is_numeric( $cell[ $size_prop ] )  && $prev_size != $cell[ $size_prop ] ) {
				$classes[] = str_replace( 
					array( '{{screensize}}', '{{size}}' ), 
					array( $size, $cell[ $size_prop ]), 
					$screensizes['size_class'] 
				);
				$prev_size = $cell[ $size_prop ];
			}

			$offset_prop = 'offset_'.$size;
			if ( isset( $cell[ $offset_prop ] ) && is_numeric( $cell[ $offset_prop ] ) && $prev_offset != $cell[ $offset_prop ] ) {
				$classes[] = str_replace( 
					array( '{{screensize}}', '{{size}}' ), 
					array( $size, $cell[ $offset_prop ] ), 
					$screensizes['offset_class'] 
				);
				$prev_offset = $cell[ $offset_prop ];
			}

		}
		return $classes;
	}

	/**
	 *	@private
	 *	@param array $item any item data
	 */
	private function mk_background_classes( $item ) {
		$classes = array();
		if ( $item['background_image'] ) {
			$classes[] = 'background-image';
		}
		if ( $item['background_video'] ) {
			$classes[] = 'background-video';
		}
		if ( $item['background_color'] ) {
			$classes[] = 'background-color';
		}
		return $classes;
	}

	/**
	 *	@private
	 *	@param array $item any item data
	 */
	private function background_style_attr( $item, $item_type = '' ) {
		$styles = array();
		if ( $item['background_image'] || $item['background_video'] ) {
			if ( $item['background_image'] ) {
				$img_src = wp_get_attachment_url( $item['background_image'], 'full' );
				$styles[ 'background-image' ] = sprintf( 'url("%s");', $img_src );
				switch ( $item['background_alignment'] ) {
					case 'tile':
						$styles[ 'background-repeat' ] = 'repeat;';
						break;
					case 'cover':
						$styles[ 'background-position' ]		= 'center center';
						$styles[ '-webkit-background-size' ]	= 'cover';
						$styles[ '-moz-background-size' ]		= 'cover';
						$styles[ '-o-background-size' ]			= 'cover';
						$styles[ 'background-size' ]			= 'cover';
						break;
					case 'fixed':
						$styles[ 'background-position' ]		= 'center center';
						$styles[ '-webkit-background-size' ]	= 'cover';
						$styles[ '-moz-background-size' ]		= 'cover';
						$styles[ '-o-background-size' ]			= 'cover';
						$styles[ 'background-size' ]			= 'cover';
						$styles[ 'background-attachment' ]		= 'fixed';
						break;
					case 'center':
						$styles[ 'background-position' ]	= 'center center';
						$styles[ 'background-repeat' ]		= 'no-repeat';
						break;
				}
			}
		} else if ( $item[ 'background_color' ] ) {
			$color = $this->mk_color( $item[ 'background_color' ], $item[ 'background_opacity' ] );
			$styles[ 'background-color' ] = $color;
		}
		$styles = apply_filters( 'gridbuilder_background_styles', $styles, $item, $item_type );
		if ( ! empty( $item_type ) ) {
			$styles = apply_filters( "gridbuilder_background_styles_{$item_type}", $styles, $item );
		}
		$style_attr = $this->implode_assoc( array_filter( $styles ), ':', ';' );
		$style_attr .= ';' . trim( $item['attr_style'], "; \t\n\r\0\x0B" );
		return $style_attr;
	}
	/**
	 *	@private
	 *	@param array $item any item data
	 */
	private function background_elements( $item ) {
		$output = '';
		$has_overlay = ( $item['background_image'] || $item['background_video'] ) && $item[ 'background_color' ];
		$has_overlay = apply_filters( 'gridbuilder_force_background_overlay', $has_overlay, $item );

		if ( $has_overlay || $item['background_image'] || $item['background_video'] ) {
			if ( $item[ 'background_video' ] ) {
				add_filter('wp_video_shortcode', array($this,'wp_video_shortcode_rm_controls'), 10, 5 );
				$mp4_src = wp_get_attachment_url( $item['background_video'] );
				if ( $mp4_src ) {
					$output .= do_shortcode( sprintf('[video src="%s" autoplay="on" loop="on" class="background-overlay" width="0"]', $mp4_src ) ); // video...
					remove_filter('wp_video_shortcode', array($this,'wp_video_shortcode_rm_controls'), 10 );
				}
			}
			if ( $has_overlay ) {
				$overlay_atts = array(
					'class'	=> 'background-overlay',
					'style'	=> sprintf('background-color:%s;', $this->mk_color( $item[ 'background_color' ], $item[ 'background_opacity' ] ) ),
				);
				$overlay_atts = apply_filters( 'gridbuilder_background_overlay_attr', $overlay_atts, $item );
				$output .= sprintf('<div %s></div>', 
					 $this->mk_attr( $overlay_atts )
				);
			}
		}
		return $output;
	}
	/**
	 *	@return html wp video shortcode without controls
	 */
	public function wp_video_shortcode_rm_controls( $output, $atts, $video, $post_id, $library ) {
		$output = str_replace( 'controls="controls"', '', $output );
		return $output;
	}
	/**
	 *	@return string 'rgba(r,g,b,a)' or #rrggbb
	 */
	private function mk_color( $color, $opacity ) {
		$a = floatval($opacity);
		if ( $opacity === '' || $a == 1 ) {
			return $color;
		}
		$color = intval( str_replace('#','',$color), 16 );

		$b = $color % 256;
		$g = ($color >> 8) % 256;
		$r = ($color >> 16) % 256;
		
		return sprintf( 'rgba(%d,%d,%d,%s)', $r, $g, $b, strval($a) );
	}

	/**
	 *	Make HTML attributes
	 *
	 *	@private
	 *	@param assoc $attr
	 */
	private function mk_attr( $attr ) {
		$output = '';
		foreach ( $attr as $key => $value ) {
			if ( $value !== false && $value !== '' ) {
				$output .= sprintf(' %s="%s"',sanitize_title($key), esc_attr($value) );
			}
		}
		return $output;
	}

	/**
	 *	Make HTML attributes
	 *
	 *	@private
	 *	@param assoc $attr
	 */
	private function implode_assoc( $assoc, $inner_glue = '=', $outer_glue = '&' ) {
		$arr = array();
		foreach ( $assoc as $key => $value ) {
			$arr[] = $key . $inner_glue . $value;
		}
		return implode( $outer_glue, $arr );
	}
	
	/**
	 * Load text domain
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'wp-gridbuilder' , false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
	}
	/**
	 * Init hook.
	 * 
	 *  - Register assets
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
	 *
	 */
	public static function uninstall(){
		delete_option( 'gridbuilder_container_templates');
		delete_option( 'gridbuilder_row_templates' );
		delete_option( 'gridbuilder_cell_templates' );
		delete_option( 'gridbuilder_widget_templates' );
		delete_option( 'gridbuilder_frontend_enqueue_bootstrap' );
	}

}
Gridbuilder::instance();

endif;

require_once plugin_dir_path(__FILE__) . 'include/api.php';

if ( is_admin() || defined( 'DOING_AJAX' ) ) {
	require_once plugin_dir_path(__FILE__) . 'include/admin-api.php';
	require_once plugin_dir_path(__FILE__) . 'include/class-GridbuilderAdmin.php';
	require_once plugin_dir_path(__FILE__) . 'include/class-GridbuilderTools.php';
	require_once plugin_dir_path(__FILE__) . 'include/class-GridbuilderSettings.php';
}
