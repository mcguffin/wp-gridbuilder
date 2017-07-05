<?php

namespace WPGridbuilder\Core;

class AnchorNav extends Singleton {
	private $_anchor_nav_link_attr;

	/**
	 *	Protected constructor
	 */
	protected function __construct() {
		add_action( 'gridbuilder_anchor_nav', array( $this, 'anchor_nav' ), 10, 4 );
		add_filter( 'gridbuilder_get_anchor_nav', array( $this, 'get_anchor_nav' ), 10, 5 );
	}

	/**
	 *	Recursivley extract nav menu items from grid data
	 *
	 *	@param array $grid_data
	 *	@param array $menuitems
	 */
	private function get_anchor_nav_items( $grid_data, &$menuitems ) {
		if ( ! isset( $grid_data['items'] ) ) {
			return;
		}
		foreach ( $grid_data['items'] as $i => $item ) {
			if ( isset( $item[ 'menu_link' ] ) && $item[ 'menu_link' ] ) {
				$menu_item = array(
					'ID'		=> $item[ 'attr_id' ],
					'classes'	=> array( 'menu-item' ),
					'title'		=> $item[ 'menu_title' ],
					'parent'	=> $item[ 'menu_parent' ],
					'url'		=> '#' . $item[ 'attr_id' ],
					'xfn'		=> '',
					'target'	=> '',
				);
				$menuitems[] = (object) $menu_item;
			}
			$this->get_anchor_nav_items( $item, $menuitems );
		}
	}


	/**
	 *	@filter nav_menu_link_attributes
	 */
	public function anchor_nav_link_attr($atts, $item, $args, $depth ) {
		return $atts + $this->_anchor_nav_link_attr;
	}


	/**
	 *	@action gridbuilder_anchor_nav
	 */
	function anchor_nav( $grid_data = null, $attr = false, $walker_config = array() ) {
		echo $this->get_anchor_nav( '', $grid_data, $attr, $walker_config );
	}


	/**
	 *	@filter gridbuilder_get_anchor_nav
	 */
	function get_anchor_nav( $output = '', $grid_data = '', $attr = false, $walker_config = array() ) {

		if ( empty( $grid_data ) && ( $post_id = get_the_ID() ) ) {
			$grid_data = get_post_meta( $post_id, '_grid_data', true );
		}

		$menuitems = array();
		$this->get_anchor_nav_items( $grid_data, $menuitems );

		$walker = new \Walker_Nav_Menu();
		$walker->db_fields = array( 'parent' => 'parent', 'id' => 'ID' );
		$walker_args = (object) wp_parse_args( $walker_config, array(
			'before'		=> '',
			'after'			=> '',
			'link_before'	=> '',
			'link_after'	=> '',
		) );

		$output = '<ul class="menu nav anchor-nav">';

		if ( $attr ) {
			$this->anchor_nav_link_attr = $attr;
			add_filter( 'nav_menu_link_attributes', array( $this, 'anchor_nav_link_attr' ), 10, 4 );
		}
		$output	.= $walker->walk( $menuitems, 10, $walker_args );
		if ( $attr ) {
			remove_filter( 'nav_menu_link_attributes', array( $this, 'anchor_nav_link_attr' ), 10 );
		}
		$output	.= '</ul>';
		return $output;
	}


}