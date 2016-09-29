<?php

namespace WPGridbuilder;

function gridbuilder_black_studio_tinymce_enable_pages( $pages ) {
	$pages[] = 'post.php';
	return $pages;
}

add_filter( 'black_studio_tinymce_enable_pages', 'WPGridbuilder\gridbuilder_black_studio_tinymce_enable_pages' );