<?php

function gridbuilder_black_studio_tinymce_enable_pages( $pages ) {
	$pages[] = 'post.php';
	return $pages;
}

add_filter( 'black_studio_tinymce_enable_pages', 'gridbuilder_black_studio_tinymce_enable_pages' );