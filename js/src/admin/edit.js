(function($,grid) {
	var l10n			= gridbuilder.l10n, 
		features		= gridbuilder.options.features,
		default_widget	= gridbuilder.options.default_widget,
		default_widget_content_property = gridbuilder.options.default_widget_content_property,
		toggleGridEditor;
	
	$(document)
		.ready(function() {

			var gridController, gridState = !! parseInt($('[name="_grid_enabled"]').val( )),
				gridOn			= '<input type="hidden" name="_grid_enabled" value="'+( gridState ? 1 : 0 ).toString()+'" />',
				btnOpen			= '<button type="button" id="edit-content-grid" class="button-secondary toggle-grid-editor">'+l10n.EditGrid+'</button>',
				btnClose		= '<button type="button" id="edit-content-text" class="button-secondary toggle-grid-editor">'+l10n.EditText+'</button>',
				initial_val		= $('[name="_grid_data"]').val( ),
				is_initial		= ! JSON.parse( initial_val ),
				gridController	= null,
				toggleWrapHtml	= '',
				autosave		= gridbuilder.options.features.autosave = !! window.getUserSetting( 'grid-autosave' );

			toggleGridEditor = function( state ) {
				var newState = _.isUndefined( state ) ? ($('#postdivrich').attr('date-grid-editor-mode') !== 'true') : state,
					initial_grid_data, initial_widget;
				$('#postdivrich').attr('date-grid-editor-mode', newState.toString() );
				$('[name="_grid_enabled"]').val( !!newState ? 1 : 0 );
				if ( ! newState ) {
					$(window).trigger('resize');
				}
				if ( newState && is_initial ) {
					initial_widget = {
						widget_class: default_widget,
						instance: { }
					};
					initial_widget.instance[ default_widget_content_property ] = $('textarea[name="content"]').val();
					initial_grid_data = { // grid
						items:[ // containers
							{
								items:[ // rows
									{
										items:[ // cells
											{
												size_xs: 12,
												items:[ // widgets
													initial_widget
												]
											}
										]
									}
								]
							}
						]
					};

					$('[name="_grid_data"]').val( JSON.stringify( initial_grid_data ) );

					is_initial = false;
				}
				if ( newState && ! gridController ) {
					gridController = new grid.controller.Grid( );
				}
			}

			toggleWrapHtml += '<div id="grid-toggle-wrap" class="grid-toolbar">';;
			toggleWrapHtml += 	'<div class="toolbar-left">';
			toggleWrapHtml += 		'<label class="set-autosave" for="grid_autosave">';
			toggleWrapHtml += 			'<input type="checkbox" name="grid_autosave" id="grid_autosave" value="1" ' + ( autosave ? 'checked' : '' ) + ' />';
			toggleWrapHtml += 			l10n.Autosave;
			toggleWrapHtml += 		'</label>';
			toggleWrapHtml += 	'</div>';
			toggleWrapHtml += 	'<div class="toolbar-right">';
			toggleWrapHtml += 		gridOn;
			toggleWrapHtml += 		btnOpen;
			toggleWrapHtml += 		btnClose;
			toggleWrapHtml += 	'</div>';
			toggleWrapHtml += '</div>';
			$('#postdivrich')
				.attr('date-grid-editor-mode', gridState.toString() )
				.prepend( toggleWrapHtml );

			toggleGridEditor( gridState );

			// Support Black Studio Tinymce Widget plugin
			if ( typeof bstw_data !== 'undefined') {
				bstw_data.deactivate_events.push( 'deactivate-tinymce' );
			}

		})
		.on('click','.toggle-grid-editor',function( e ) {

			toggleGridEditor();

		})
		.on('change','[name="grid_autosave"]',function( e ) {

			var state = !! $( this ).prop('checked');

			features.autosave = state;

			window.setUserSetting( 'grid-autosave', state );

		});
		
})(jQuery,window.grid);