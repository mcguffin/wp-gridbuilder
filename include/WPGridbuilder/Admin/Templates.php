<?php

namespace WPGridbuilder\Admin;

use WPGridbuilder\Core;
use WPGridbuilder\Settings;



class Templates extends Core\Singleton {


	protected function __construct() {

		add_option( 'gridbuilder_container_templates', array() );
		add_option( 'gridbuilder_row_templates', array() );
		add_option( 'gridbuilder_cell_templates', array() );
		add_option( 'gridbuilder_widget_templates', array() );

		add_action( 'wp_ajax_gridbuilder-create-template', array( &$this, 'ajax_save_template' ) );
		add_action( 'wp_ajax_gridbuilder-update-template', array( &$this, 'ajax_save_template' ) );
		add_action( 'wp_ajax_gridbuilder-delete-template', array( &$this, 'ajax_delete_template' ) );

		add_filter( 'gridbuilder_edit_script_options', array( $this, 'script_options' ) );
		add_filter( 'gridbuilder_edit_script_l10n', array( $this, 'script_l10n' ) );
	}

	/**
	 *	@filter gridbuilder_edit_script_options
	 */
	public function script_options( $script_options ) {

				// element templates
		$script_options[ 'templates' ] = array(
			'container'		=> Settings\Templates::container(),
			'row'			=> Settings\Templates::row(),
			'cell'			=> Settings\Templates::cell(),
			'widget'		=> Settings\Templates::widget(),
		);

		return $script_options;
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
				update_option( "gridbuilder_{$type}_templates", $templates );
			}

			header( 'Content-Type: application/json' );
			echo json_encode( $template );
		}
		die('');
	}


}