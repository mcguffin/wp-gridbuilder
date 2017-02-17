<?php

namespace WPGridbuilder;

function __autoload( $class ) {
	$ds = DIRECTORY_SEPARATOR;
	$file = GRIDBUILDER_DIRECTORY . 'include' . $ds . str_replace( '\\', $ds, $class ) . '.php';
	if ( file_exists( $file ) ) {
		require_once $file;
	}
}

spl_autoload_register( 'WPGridbuilder\__autoload' );