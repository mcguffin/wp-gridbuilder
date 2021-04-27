<?php

namespace WPGridbuilder;

function __autoload( $class ) {
	if ( in_array( strpos( $class, __NAMESPACE__ ), array( 0,1 ), true ) ) {
		$ds = DIRECTORY_SEPARATOR;
		$file = GRIDBUILDER_DIRECTORY . 'include' . $ds . str_replace( '\\', $ds, $class ) . '.php';
		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
}

spl_autoload_register( 'WPGridbuilder\__autoload' );