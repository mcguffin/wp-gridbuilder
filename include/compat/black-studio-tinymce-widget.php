<?php

namespace WPGridbuilder;

function black_studio_tinymce_enable_pages( $pages ) {
	$pages[] = 'post.php';
	return $pages;
}

add_filter( 'black_studio_tinymce_enable_pages', 'WPGridbuilder\black_studio_tinymce_enable_pages' );