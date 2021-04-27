<?php

namespace WPGridbuilder\Admin;

use WPGridbuilder\Core;
use WPGridbuilder\Settings;



class Templates extends Core\Singleton {
	private $template_theme_path;

	protected function __construct() {

		add_option( 'gridbuilder_container_templates', array() );
		add_option( 'gridbuilder_row_templates', array() );
		add_option( 'gridbuilder_cell_templates', array() );
		add_option( 'gridbuilder_widget_templates', array() );

		add_action( 'wp_ajax_gridbuilder-create-template', array( &$this, 'ajax_save_template' ) );
		add_action( 'wp_ajax_gridbuilder-update-template', array( &$this, 'ajax_save_template' ) );
		add_action( 'wp_ajax_gridbuilder-delete-template', array( &$this, 'ajax_delete_template' ) );

		add_filter( 'gridbuilder_edit_script_options', array( $this, 'append_templates' ) );
		add_filter( 'gridbuilder_edit_script_l10n', array( $this, 'script_l10n' ) );

		$this->template_theme_path = get_stylesheet_directory() . '/wp-gridbuilder';
		if ( ! file_exists( $this->template_theme_path ) ) {
			$this->template_theme_path = false;
		}
	}

	/**
	 *	@filter gridbuilder_edit_script_options
	 */
	public function append_templates( $array ) {

		// element templates
		$array[ 'templates' ] = $this->get_templates();

		return $array;
	}
	
	/**
	 *	@filter gridbuilder_edit_script_l10n
	 */
	public function script_l10n( $script_l10n ) {
		$script_l10n += array(
			'Template'			=> __( 'Template',  'wp-gridbuilder' ),
			'Templates'			=> __( 'Templates',  'wp-gridbuilder' ),
			'ManageTemplates'
								=> __( 'Manage Templates',  'wp-gridbuilder' ),
			'TemplateName'		=> __( 'Template Name',  'wp-gridbuilder' ),
			'CreateTemplateDescription'
								=> __( 'The Template will be available at blahblah...',  'wp-gridbuilder' ),
		);
		return $script_l10n;
	}

	/**
	 *	Ajax: Delete a template
	 */
	public function ajax_delete_template() {
		if ( isset( $_POST[ 'nonce' ],  $_POST[ 'template' ] ) && wp_verify_nonce( $_POST[ 'nonce' ], $_REQUEST[ 'action' ] ) && current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ) ) {
			$template = json_decode( stripslashes( $_POST[ 'template' ] ), true );
			
			$template = wp_parse_args($template, array(
				'slug'	=> '',
				'type'	=> false,
			));
			$type = in_array( $template['type'], array( 'container', 'row', 'cell', 'widget' ) ) ? $template['type'] : false;
			if ( $type !== false && ! empty( $template['slug'] ) ) {
				$templates = get_option( "gridbuilder_{$type}_templates" );
				if ( isset( $templates[ $template['slug'] ] ) ) {
					unset( $templates[ $template['slug'] ] );
					update_option( "gridbuilder_{$type}_templates", $templates );
				}
				$this->delete_from_theme( $template['slug'], $type );
				header( 'Content-Type: application/json' );
				echo json_encode( array( 'success' => true ) );
			}
		}
		die('');
	}

	/**
	 *	Ajax: Create or update a template
	 */
	public function ajax_save_template() {
		if ( isset( $_POST[ 'nonce' ],  $_POST[ 'template' ] ) && wp_verify_nonce( $_POST[ 'nonce' ], $_REQUEST[ 'action' ] ) && current_user_can( get_option( 'gridbuilder_manage_templates_capability' ) ) ) {


			$template = json_decode( stripslashes( $_POST[ 'template' ] ), true );
			
			$template = wp_parse_args($template, array(
				'name'	=> '',
				'slug'	=> '',
				'data'	=> array(),
				'type'	=> false,
			));
			$type = in_array( $template['type'], array( 'container', 'row', 'cell', 'widget' ) ) ? $template['type'] : false;

			if ( $type !== false && ! empty( $template['name'] ) && ! empty( $template['slug'] ) && ! empty( $template['data'] ) ) {
				$templates = get_option( "gridbuilder_{$type}_templates" );

				$template['name'] = sanitize_text_field( $template['name'] );
				$template['_updated'] = time();

				// use unique slug if create
				if ( $_REQUEST[ 'action' ] == 'gridbuilder-create-template' && isset( $templates[ $template['slug'] ] ) ) {
					$i = 1;
					while ( isset( $templates[ $template['slug'] . '-' . $i ] ) ) {
						$i++;
					}
					$template['slug'] = $template['slug'] . '-' . $i;
				} else {
					$template['slug'] = sanitize_title( $template['slug'] );
				}

				$template[ 'data' ]['template'] = $template['slug'];

				$templates[ $template['slug'] ] = $template;

				ksort( $templates );

				update_option( "gridbuilder_{$type}_templates", $templates );

				// maybe save to theme
				$this->save_to_theme( $template['slug'], $template );
			}

			header( 'Content-Type: application/json' );
			echo json_encode( $template );
		}
		die('');
	}

	private function save_to_theme( $slug, $template_data ) {

		if ( ! $this->template_theme_path ) {
			return;
		}

		$save_path = $this->template_theme_path . '/' . $template_data[ 'type' ] . '/';
		wp_mkdir_p( $save_path );
		$save_data = json_encode( $template_data, JSON_PRETTY_PRINT );
		file_put_contents($save_path . $slug . '.json', $save_data);
	}

	private function delete_from_theme( $slug, $type ) {

		if ( ! $this->template_theme_path ) {
			return;
		}

		$file = $this->template_theme_path . '/' . $type . '/' . $slug . '.json';

		if ( file_exists( $file ) ) {
			unlink( $file );
		}
	}
	
	public function fetch_from_theme() {
		$to_sync = $this->get_fetch_from_theme_results();
		$tpl = $this->get_templates();
		$theme_tpl = $this->get_templates_from_theme();
		$count_result = 0;

		$to_sync = array_intersect_key( $to_sync, array( 'container' => 0, 'row'=> 0, 'cell' => 0, 'widget' => 0 ) );

		foreach ( $to_sync as $type => $sync ) {
			if ( $sync === true ) {
				$tpl[ $type ] = $theme_tpl[ $type ];
				$count_result += count( $theme_tpl );
				continue;
			} else {
				foreach ( array_keys( $sync ) as $slug ) {
					$tpl[ $type ][ $slug ] = $theme_tpl[ $type ][ $slug ];
					$count_result++;
				}
			}
			update_option( "gridbuilder_{$type}_templates", $tpl[ $type ] );
		}
		return $count_result;
	}
	
	public function get_fetch_from_theme_results() {
		$sync_result = array('_total' => 0 );
		$tpl = $this->get_templates();
		$theme_tpl = $this->get_templates_from_theme();

		foreach ( $theme_tpl as $type => $templates ) {
			if ( ! isset( $tpl[$type] ) ) {
				$sync_result[$type] = true;
				$sync_result['_total'] += count($templates);
				continue;
			}
			$sync_result[$type] = array();

			foreach ( $templates as $slug => $template ) {

				if ( ! isset( $tpl[ $type ][ $slug ] ) ) {

					$sync_result[$type][ $slug ] = true;
					$sync_result['_total']++;
				} else if ( ! isset( $tpl[ $type ][ $slug ]['_updated'] ) || $tpl[ $type ][ $slug ]['_updated'] < $template['_updated'] ) {
					$sync_result[$type][ $slug ] = true;
					$sync_result['_total']++;
				}
			}
			if ( empty( $sync_result[$type] ) ) {
				unset( $sync_result[$type] );
			}
		}

		return array_filter($sync_result);
	}
	
	private function get_templates_from_theme() {

		$templates = array();

		if ( ! $this->template_theme_path ) {
			return $templates;
		}

		foreach ( array( 'container','row','cell','widget' ) as $type ) {
			$lookup_path = $this->template_theme_path . '/' . $type . '/';
			$files = glob( $lookup_path . '*.json' );
			$templates[ $type ] = array();
			foreach ( $files as $file ) {
				$template = json_decode( file_get_contents( $file ), true );
				if ( is_array( $template ) && isset( $template[ 'slug' ] ) ) {
					$templates[ $type ][ $template[ 'slug' ] ] = $template;
				}
			}
		}
		return $templates;
	}
	private function get_templates() {
		return array(
			'container'		=> Settings\Templates::container(),
			'row'			=> Settings\Templates::row(),
			'cell'			=> Settings\Templates::cell(),
			'widget'		=> Settings\Templates::widget(),
		);
	}
}