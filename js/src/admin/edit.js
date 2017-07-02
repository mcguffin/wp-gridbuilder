(function($,grid) {
	var l10n			= gridbuilder.l10n, 
		features		= gridbuilder.options.features,
		default_widget	= gridbuilder.options.default_widget,
		default_widget_content_property = gridbuilder.options.default_widget_content_property,
		gridController, toggleGridEditor,
		element		= grid.view.element;
	
	$(document)
		.ready(function() {

			var gridState = !! parseInt($('[name="_grid_enabled"]').val( )),
				gridOn			= '<input type="hidden" name="_grid_enabled" value="'+( gridState ? 1 : 0 ).toString()+'" />',
				btnOpen			= '<button type="button" id="edit-content-grid" class="button-secondary toggle-grid-editor">'+l10n.EditGrid+'</button>',
				btnClose		= '<button type="button" id="edit-content-text" class="button-secondary toggle-grid-editor">'+l10n.EditText+'</button>',
				initial_val		= $('[name="_grid_data"]').val( ),
				is_initial		= ! JSON.parse( initial_val ),
				toggleWrapHtml	= '',
				autosave		= gridbuilder.options.features.autosave = !! window.getUserSetting( 'grid-autosave' );

			gridController	= null;

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

		})

		.on('copy cut', function(e) {
			var sel = gridController.getSelected(),
				data, editor;

			if ( ! sel ) {
				return;
			}

			data = JSON.stringify( sel.model.toJSON() )
			e.originalEvent.clipboardData.setData( 'application/json', data );
			if ( e.type === 'cut' ) {
				editor = grid.getActiveEditor();
				editor._deleteItem( sel );
			}
			e.preventDefault();
		})
		.on('paste', function(e) {
			var gridEl = grid.view.element,
				sel = gridController.getSelected(),
				dataStr = e.originalEvent.clipboardData.getData( 'application/json' ),
				data, editor,				
				itemClass, parent, after;

			if ( ! sel ) {
				return;
			}

			try {
				data = JSON.parse( dataStr )
			} catch( err ) {
				return;
			}
			if ( ! data || [ 'grid','container','row','cell','widget' ].indexOf(data.type) === -1 ) {
				return;
			}

			if ( data.type == 'grid' && sel.is( gridEl.Grid ) ) {
				// replace entire grid
				return;
			}

			if ( data.type === 'container' ) {
				// append to grid
				itemClass = element.Container;
				if ( sel.is( element.Grid ) ) {
					// append to sel
					parent = sel;
				} else if (  sel.is( element.Container ) ) {
					// insert after sel
					after = sel;
					parent = sel.parent();
				} else {
					return;
				}
			}
			if ( data.type === 'row' ) {
				// append to grid
				itemClass = element.Row;
				if ( sel.is( element.Container ) ) {
					// append to sel
					parent = sel;
				} else if (  sel.is( element.Row ) ) {
					// insert after sel
					after = sel;
					parent = sel.parent();
				} else {
					return;
				}
			}
			if ( data.type === 'cell' ) {
				// append to grid
				itemClass = element.Cell;
				if ( sel.is( element.Row ) ) {
					// append to sel
					parent = sel;
				} else if (  sel.is( element.Cell ) ) {
					// insert after sel
					after = sel;
					parent = sel.parent();
				} else {
					return;
				}
			}
			if ( data.type === 'widget' ) {
				// append to grid
				itemClass = element.Widget;
				if ( sel.is( element.Cell ) ) {
					// append to sel
					parent = sel;
				} else if ( sel.is( element.Widget ) ) {
					// insert after sel
					after = sel;
					parent = sel.parent();
				} else {
					return;
				}
			}
			editor = grid.getActiveEditor();
			editor._addItem( itemClass, parent, data, after );
		});

	// extend mce
	$( document ).on( 'tinymce-editor-setup', function( event, editor ) {
		var props = [
			'body_class',
			'content_css',
			'entities',
			'entity_encoding',
			'formats',
			'language',
			'plugins',
			'preview_styles',
			'toolbar1',
			'toolbar2',
			'toolbar3',
			'toolbar4',
			'wp_lang_attr',
			'wp_shortcut_labels'
		];
//		console.log(editor.settings);
		$.each(props, function( i, prop ) {
			editor.settings[prop] = tinyMCEPreInit.mceInit.content[ prop ];
		});

// 		if ( editor.settings.toolbar1 && -1 === editor.settings.toolbar1.indexOf( 'blockquote' ) ) {
// 			editor.settings.toolbar1 += ',blockquote';
// 		}
	});



})(jQuery,window.grid);