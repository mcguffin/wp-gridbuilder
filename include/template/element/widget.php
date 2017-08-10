<?php

if ( ! defined('ABSPATH') ) 
	die();

?>
	<script type="text/html" id="tmpl-grid-element-widget">
		<div class="background"><div class="color"></div></div>
		<#
		var widget_class = unescape( data.model.get('widget_class') ),
			widget_type = gridbuilder.options.widgets[ widget_class ],
			instance = data.model.get('instance'),
			info_attr = '';
		(function($){
			var uuid;
			switch ( widget_class.toLowerCase() ) {
				case 'wp_widget_media_image':
					if ( !! instance.url ) {
						info_attr += ' style="';
						info_attr += "background-image:url('" + instance.url + "');";
						info_attr += '"';
						info_attr += ' data-image="' + instance.url + '"';
					}
					break;
				case 'wp_widget_media_audio':
				case 'wp_widget_media_video':
					if ( !! instance.url ) {
						info_attr += ' data-code="';
						info_attr += instance.url;
						info_attr += '"';
					}
					break;
				case 'wp_widget_text':
					if ( instance.text ) {
						info_attr += ' data-text="';
						info_attr += jQuery( '<div>' + instance.text + '</div>' ).text();
						info_attr += '"';
					}
					break;
				case 'wp_widget_custom_html':
					if ( instance.content ) {
						info_attr += ' data-code="';
						info_attr += instance.content;
						info_attr += '"';
					}
					break;
				case 'wp_nav_menu_widget':
					uuid = 'm' + Math.round( Math.random() * 100000 );
					$.post({
						url:ajaxurl,
						data: $.extend(instance,{action:'get_nav_menu_object'}),
						success: function( response ) {
							$( '[data-title="' + uuid +'"]' ).attr('data-title', response.data.name )
						}
					});
					info_attr += ' data-title="' + uuid +'"';
					break;
				case 'wp_widget_tag_cloud':
					// should display taxonomy name
					break;
			}
		})(jQuery);
		#>
		<div class="sort-handle"></div>
		<div class="info" <# print( info_attr ) #>>
			<div class="display-attributes">
				<span class="display-id"></span>
				<span class="display-class"></span>
			</div>
			<#
				if ( !! widget_type ) {
					icon = widget_type.icon;
				} else {
					icon = 'dashicons-dashboard';
				}
				print( '<span class="widget-icon dashicons '+icon+'"></span>' );
			#>
			<div class="widget-title"><#
				print( instance['title'] );
			#></div>
			<div class="widget-type"><#
				if ( !! widget_type ) {
					print( widget_type.name );
				} else {
					print( gridbuilder.l10n.unkonwnWidget );
				}
			
			#></div>
		</div>
	</script>
