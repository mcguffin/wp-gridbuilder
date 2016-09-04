(function($,exports){

	var Prompt, Dialog, Modal, Toolbar,

		l10n		= gridbuilder.l10n,
		options		= gridbuilder.options,
		features	= gridbuilder.options.features,
		grid		= exports.grid,
		
		Grid		= exports.grid.view.element.Grid,
		Container	= exports.grid.view.element.Container,
		Row			= exports.grid.view.element.Row,
		Cell		= exports.grid.view.element.Cell,
		Widget		= exports.grid.view.element.Widget
		;

	Prompt = grid.view.ui.Prompt = wp.media.View.extend({
		tagName:    'div',
		className: 'grid-prompt',
		template: wp.template('grid-ui-prompt'),
		events: {
			'click .btn-confirm':	'confirm',
			'click .btn-cancel':	'close'
		},
		initialize: function( options ) {
			_.defaults( options, {
				defaultValue: '',
				title: '',
				message: '',
				parent:false
			});
			wp.media.View.prototype.initialize.apply( this, arguments );
			this.$parent = $( !!options.parent ? options.parent : 'body' );

			return this.render();
		},
		render: function() {
			wp.media.View.prototype.render.apply( this, arguments );
			return this;
		},
		open: function() {
			this.$parent.append( this.$el );
			this.$('[type="text"]').focus().select();
			return this;
		},
		close: function() {	
			this.$el.remove();
			return this;
		},
		confirm: function() {
			this.trigger( 'confirm' );
			this.close();
		},
		getValue: function() {
			return this.$('[type="text"]').val();
		}
	});



	Modal = grid.view.ui.Modal = wp.media.view.Modal.extend({
		template: wp.template('grid-ui-modal'),
		events: {
			'click .media-modal-prev': 'prev',
			'click .media-modal-next': 'next',
			'click .media-modal-backdrop, .media-modal-close': 'escapeHandler',
			'keydown': 'keydown'
		},
		initialize: function() {
			var ret = wp.media.view.Modal.prototype.initialize.apply( this, arguments );
			this.prevnext = ! _.isUndefined( this.options.prev ) && ! _.isUndefined( this.options.next );
			return ret;
		},
		render: function() {
			var ret = wp.media.view.Modal.prototype.render.apply( this, arguments );
			if ( this.prevnext ) {
				this.$('.media-modal-prev').prop( 'disabled', ! this.options.prev );
				this.$('.media-modal-next').prop( 'disabled', ! this.options.next );
			} else {
				this.$('.media-modal-prev, .media-modal-next').remove();
			}
			return ret;
		},
		open: function() {
			wp.media.view.Modal.prototype.open.apply( this, arguments );
			// body.modal-open prevetns rte toolbars from rendering
			$( 'body' ).removeClass( 'modal-open' ).addClass('grid-modal-open');
			
		},
		close: function( options ) {
			wp.media.view.Modal.prototype.close.apply( this, arguments );
			// body.modal-open prevetns rte toolbars from rendering
			$( 'body' ).removeClass( 'grid-modal-open' );
		},
		next: function(){
			this.trigger('next');
			return false;
		},
		prev: function(){
			this.trigger('prev');
			return false;
		}
	});


	Dialog = grid.view.ui.Dialog = wp.media.View.extend({
		initialize: function( options ) {
			var self = this;
			
			this.model		= options.model;
			this.controller	= options.controller;

			// setup button
			this.okayBtn = new wp.media.view.Button( { text: l10n.Done, classes: ['apply','button-primary'] } );

			return this;
		},
		render: function(){
			wp.media.View.prototype.render.apply( this, arguments );

			this.$('.grid-dialog-title').text( this.options.title );
			
			// render button
			this.okayBtn.render();
			this.$('.grid-dialog-toolbar').append( this.okayBtn.$el );
		},
		dismiss: function() {
			this.$('.grid-dialog-content').html('');
		}
	});

	Toolbar = grid.view.ui.Toolbar = wp.media.View.extend({
		template: wp.template('grid-ui-toolbar'),
		className:'grid-toolbar',
		tagName:'div',
		events: {
			// prevent selection from loosing focus
//			'mousedown *':							'preventDefault',

			'click .viewswitcher [type="radio"]':	'switchView',


			'click .set-visibility [type="radio"]':	'setVisible',
			
			'click button.add-item':				'addItem',
			'change select.add-item':				'addTemplateItem',
/*
			'change select.add-container':			'addContainer',
			'click button.add-container':			'addContainer',

			'change select.add-row':				'addRow',
			'click button.add-row':					'addRow',

			'change select.add-cell':				'addCell',
			'click button.add-cell':				'addCell',

			'change select.add-widget':				'addWidget',
			'click button.add-widget':				'addWidget',
*/

			'click .item-action.edit':				'editItem',
			'click .item-action.clone':				'cloneItem',
			'click .item-action.delete':			'deleteItem',
			'click .item-action.lock':				'lockItem',

			'click .create-template':				'createTemplate',
			'click .update-template':				'updateTemplate',
			'click .manage-templates':				'manageTemplates',
		},
		initialize: function() {
			wp.media.View.prototype.initialize.apply( this, arguments );
			// create toolbar
			this.delegateEvents();
			this.setupSticky();
		},
		render: function() {
			wp.media.View.prototype.render.apply( this, arguments );

			this.setupViewswitcher();

			this.setupTemplateSelects();

			this.updateWidth();

			viewSize = window.getUserSetting( 'grid-view-size' );

			if ( !!viewSize ) {
				this.$('.viewswitcher [value="'+viewSize+'"]').prop('checked',true);
			} else {
				this.$('.viewswitcher [type="radio"]:last').prop('checked',true);
			}
			this.switchView();

		},
		preventDefault:function(e) {
			// prevent selected element from loosing focus
			e.preventDefault();
		},
		addItem: function( e ) {
			this.trigger( 'add:' + $(e.target).data('add-item') )
			e.preventDefault();
		},
		addTemplateItem: function( e ) {
			this.trigger( 'add:' + $(e.target).data('add-item'), $(e.target).val() );
			$(e.target).val('');
			e.preventDefault();
		},
		editItem: function( e ) {
			this.trigger( 'edit' );
			e.preventDefault();
		},
		cloneItem: function( e ) {
			this.trigger( 'clone' );
			e.preventDefault();
		},
		deleteItem: function( e ) {
			this.trigger( 'delete' );
			e.preventDefault();
		},
		lockItem: function( e ) {
			this.trigger( 'lock' );
			e.preventDefault();
		},
		setVisible: function() {
			this.trigger('visible', this.$('.set-visibility [type="radio"]:checked').val() );
		},

		setupSticky: function() {
			var self = this;

			$(window).on('scroll',function() {
				var oldState = self.$el.attr('data-sticky') === 'true',
					newState = ( $(window).scrollTop() + 33 ) >= self.controller.$el.offset().top;
				if ( oldState != newState ) {
					self.$el.attr( 'data-sticky', newState.toString() );
				}
			});
			$(window).on('resize',function() {
				self.updateWidth();
			});
		},
		updateWidth: function() {
			this.$el.css( 'width', this.controller.$el.width().toString() + 'px' );
		},
		update: function() {
			var item = this.controller.getSelected(),
				can_visibility = can_edit = can_clone = can_delete = can_lock = false,
				can_visible = can_create_template = can_update_template = false,
				can_add_container = can_add_row = can_add_cell = can_add_widget = false,
				can_manage_templates = true;

			if ( !! item ) {
				var item_is_grid = item.is( grid.view.element.Grid ),
					is_unlocked	= features.locks || ! item.model.get( 'locked' ),
					is_parent_unlocked
								=  features.locks || ! ( item.parent() && item.parent().model.get( 'locked' ) ),
				
					closest_grid 		= item.closest( grid.view.element.Grid ),
					closest_container	= item.closest( grid.view.element.Container ),
					closest_row			= item.closest( grid.view.element.Row ),
					closest_cell		= item.closest( grid.view.element.Cell ),
					item_visibility 	= item.model.get( 'visibility_' + this.whichView() ) || '';

				can_edit	= ! item_is_grid && is_unlocked;
				can_clone	= ! item_is_grid && is_unlocked && is_parent_unlocked;
				can_delete	= ! item_is_grid && is_unlocked && is_parent_unlocked;
				can_lock	= true;
				can_visible	= ! item_is_grid;

				can_create_template		= ! item_is_grid;
				can_update_template		= ! item_is_grid && !!item.model.get( 'template' );
				
				can_add_container	= features.locks || ! closest_grid.model.get( 'locked' );
				can_add_row			= !! closest_container && ( features.locks || ! closest_container.model.get( 'locked' ) );
				can_add_cell		= !! closest_row && ( features.locks || ! closest_row.model.get( 'locked' ) );
				can_add_widget		= !! closest_cell && ( features.locks || ! closest_cell.model.get( 'locked' ) );


				this.$('.item-action.lock').prop( 'checked', !! item.model.get( 'locked' ) );

				this.$('[name="set-visibility"]').each(function( i, el ) { 
					var $this = $(this);
					$this.prop( 'checked', $this.val() == item_visibility );
				});
//				this.trigger( 'select' );
			}
			this.$('.item-action.edit').prop( 'disabled', ! can_edit );
			this.$('.item-action.clone').prop( 'disabled', ! can_clone );
			this.$('.item-action.delete').prop( 'disabled', ! can_delete );
			this.$('.item-action.lock').prop( 'disabled', ! can_lock );

			this.$('.create-template').prop( 'disabled', ! can_create_template );
			this.$('.update-template').prop( 'disabled', ! can_update_template );
			this.$('.manage-templates').prop( 'disabled', ! can_manage_templates );

			this.$('.add-container').prop( 'disabled', ! can_add_container );
			this.$('.add-row').prop( 'disabled', ! can_add_row );
			this.$('.add-cell').prop( 'disabled', ! can_add_cell );
			this.$('.add-widget').prop( 'disabled', ! can_add_widget );

			this.$('[name="set-visibility"]').prop( 'disabled', ! can_visible );
		},
		
		setupViewswitcher: function() {
			var self = this;
			_.each( options.screensizes.sizes, function( sizeOptions, size ) {
				var sizeOpts = {size:size}, html;
				_.extend( sizeOpts, sizeOptions );
				html = wp.template('viewsize-item')(sizeOpts);
				self.$('.viewswitcher').append( html );
			});
		},
		
		setupTemplateSelects: function(  ) {
			this.$('select.add-item[data-add-item]').each(function(){
				var $self = $(this),
					type = $self.attr('data-add-item');
				// remove previous 
				$(this).find('[value!=""]').remove();
				grid.templates[type].each(function(el,i) {
					var tplData = grid.templates[type].get( el.id ).toJSON();
					$('<option value="'+tplData.id+'">'+tplData.name+'</option>').appendTo( $self );
				});
			});
		},

		switchView: function( ) {
			var newView = this.whichView(),
				oldView = this.$el.attr( 'data-view-size' ),
				changed = oldView != newView;
			if ( newView ) {
				this.trigger( 'viewsize', this );
				// store in user settings
				window.setUserSetting( 'grid-view-size', newView );
			}
		},

		whichView: function(){
			return this.$('.viewswitcher :checked').val();
		},
		delegateEvents: function() {
			wp.media.View.prototype.delegateEvents.apply( this, arguments );

			this.on( 'viewsize', this.updateVisibilitySelect, this );
			this.on( 'select', this.updateVisibilitySelect, this );
			this.on( 'select', this.updateLockButton, this );
		},
		undelegateEvents: function() {
			wp.media.View.prototype.undelegateEvents.apply( this, arguments );
		},
		updateVisibilitySelect: function() {
			var current = this.controller.getSelected(),
				visiValue;

			if ( !!current && ! current.is( grid.view.element.Grid ) ) {
				visiValue = current.model.get( 'visibility_' + this.whichView() ) || '';
	 			this.$('[name="set-visibility"][value="' + visiValue + '"]').prop( 'checked', true );
	 		}
		},
		updateLockButton: function() {
			var current = this.getSelected(),
				visiValue;

			if ( !!current && ! current.is( Grid ) ) {
	 			this.$('.item-action.lock').prop( 'checked', !! current.model.get( 'locked' ) );
	 		}
		},
		createTemplate: function(e) {
			this.trigger( 'create:template' );
			e.preventDefault();
		},
		updateTemplate: function(e) {
			this.trigger( 'update:template' );
			e.preventDefault();
		},
		manageTemplates: function(e) {
			this.trigger( 'manage:templates' );
			e.preventDefault();
		}

	});

	Editor = grid.view.ui.Editor = wp.media.View.extend({
		className:'grid-editor',
		tagName:'div',
		selectWidgetModal: null,
		events:{
			'focusout *': function( e ) {
				// console.log('blur',e);
			},
			'focusin *': function( e ) {
				var view = $(e.target).data('view');
				if ( !! view ) {
					this.setSelected( view );
				}
			},
			'keyup *': function( e ) {
				var can_edit, 
					sel = this.getSelected();

				if ( ! sel ) {
					return;
				}

				switch ( e.keyCode ) {
					case 13: // return
						can_edit = features.locks || ! sel.model.get( 'locked' );
						can_edit && this.editItem();
						break;
					case 32: // space
						break;
					case 46: // DEL
					case 8: // backspace
						can_edit = features.locks || ! sel.model.get( 'locked' );
						can_edit && this.deleteItem();
						e.preventDefault();
						e.stopPropagation();
						break;
					case 37: // arrow-left
						can_edit = features.locks || ! sel.model.get( 'locked' );
					
						break;
					case 38: // arrow-up
						break;
					case 39: // arrow-right
						can_edit = features.locks || ! sel.model.get( 'locked' );
						break;
					case 40: // arrow-down
						break;
				}
			}
		},

		initialize: function() {
			wp.media.View.prototype.initialize.apply( this, arguments );
			// create toolbar
			this.toolbar = new grid.view.ui.Toolbar({
				controller: this
			});
			// create gridview
			this.grid = new grid.view.element.Grid({
				controller: this,
				model: this.model
			});
			this.bindEvents();
		//	this.render();
		},
		bindEvents: function() {
			var self = this;

			$(document).on( 'click', function() { 
				self.checkSelected.apply(self,arguments);
			});
			$(document).on( 'keydown', this.preventBackspaceNav );
			
			this.toolbar.on( 'edit', this.editItem, this );
			this.toolbar.on( 'clone', this.cloneItem, this );
			this.toolbar.on( 'delete', this.deleteItem, this );
			this.toolbar.on( 'lock', this.toggleLockState, this );

			this.toolbar.on( 'visible', this.setVisible, this );
			this.toolbar.on( 'visible', this.reFocus, this );
			this.toolbar.on( 'viewsize', this.onChangeViewsize, this );
			this.toolbar.on( 'viewsize', this.reFocus, this );

			this.toolbar.on( 'create:template', this.createTemplate, this );
			this.toolbar.on( 'update:template', this.updateTemplate, this );
			this.toolbar.on( 'manage:templates', this.openTemplateManager, this );

			this.toolbar.on( 'add:container', this.addContainer, this );
			this.toolbar.on( 'add:row', this.addRow, this );
			this.toolbar.on( 'add:cell', this.addCell, this );
			this.toolbar.on( 'add:widget', this.addWidget, this );

		},
		preventBackspaceNav: function( e ) {
			var el = event.srcElement || event.target;
			if ( $( el ).is( ":input" ) || $( el ).is( "[contenteditable]" ) ) {
				return;
			}
			e.keyCode === 8 && e.preventDefault();
		},
		render: function() {
			wp.media.View.prototype.render.apply( this, arguments );
			this.toolbar.render();
			this.grid.render();
			this.$el.append( this.toolbar.$el );
			this.$el.append( this.grid.$el );
		},
		setActiveEditor: function(  ) {
			grid.setActiveEditor( this );
		},
		onChangeViewsize: function(){
			this.$el.attr('data-view-size', this.toolbar.whichView() );
		},
		getSelected: function() {
			return this.controller.getSelected(this);
		},
		checkSelected: function( e ) {
			if ( ! this.$el.has( e.target ).length && ! $(e.target).closest('.grid-ui-modal') ) {
				this.setSelected( null );
			}
		},
		setSelected:function( item ) {
			this.controller.setSelected( item );
			this.toolbar.update();
			if ( !! item && ! item.$el.is(':focus') ) {
				item.$el.focus();
			}
//			this.$el.focus();

			return this;
		},
		
		/**
		 *	Managing items
		 */
		addContainer:function( ) {
			var template = arguments.length ? grid.templates.get( 'container', arguments[0] ) : false,
				val = template ? template.get('data') : {};
			
			this._addItem( grid.view.element.Container, this.grid, val );
			
			return false;
		},
		addRow: function( e ) {
			var current		= this.getSelected(),
				parent		= current.closest( grid.view.element.Container ),
				template	= arguments.length ? grid.templates.get( 'row', arguments[0] ) : false,
				val			= template ? template.get('data') : {};

			this._addItem( grid.view.element.Row, parent, val );

			return false;
		},
		addCell: function( e ) {
			var current	= this.getSelected(),
				parent	= current.closest( grid.view.element.Row ),
				template = arguments.length ? grid.templates.get( 'cell', arguments[0] ) : false,
				val = template ? template.get('data') : { size_xs: 12 };

			this._addItem( grid.view.element.Cell, parent, val );

			return false;
		},
		addWidget: function( e ) {
			var self		= this,
				current		= this.getSelected(),
				parent		= current.closest( grid.view.element.Cell ),
				template	= arguments.length ? grid.templates.get( 'widget', arguments[0] ) : false,
				val			= template ? template.get('data') : { instance: {} },
				model		= new Backbone.Model(), dialog;

			if ( !! template ) {
				this._addItem( grid.view.element.Widget, parent, val );
			} else {
				if ( this.selectWidgetModal === null ) {
					this.selectWidgetModal = new wp.media.view.Modal( { controller: this } ),

					dialog = new grid.view.SelectWidgetDialog( { 
									controller: this,
									model: model,
									title: l10n.SelectWidget
								} );

					dialog.on( 'done', function() {
						val.widget_class = model.get( 'widget_class' );
						self._addItem( grid.view.element.Widget, parent, val ).editItem( );
						self.selectWidgetModal.close();
					}, this.selectWidgetModal );

					this.selectWidgetModal.content( dialog );
				}
				this.selectWidgetModal.open();
			}

			return false;
		},
		cloneItem: function() {
			var current = this.getSelected(),
				itemClass = current.getClass(),
				parent = current.parent(),
				data = current.model.toJSON();
			delete(data.idx);
			

			this._addItem( itemClass, parent, data );

			return false;
		},
		_addItem: function( itemClass, parent, data ) {
			var current = this.getSelected() || this,
				data = data || {},
				itemModel = new grid.model.GridObject( data ),
				item = new itemClass({
					controller:	this.controller,
					model:		itemModel,
					parent:		parent
				}),
				$collection, after;

			after = current.closest( itemClass );

			// add DOM elements
			$collection = parent.$('>.collection');

			if ( !!after ) {
				item.render().$el.insertAfter( after.$el );
			} else {
				$collection.append( item.render().$el );
			}

			// add to model
			parent.model.items.add( itemModel );
			
			this.grid.initSortables();
			this.grid.hasChanged();

			this.setSelected( item );
			
			return this;
		},
		getPrevItem: function( current ) {
			var prev,
				current = current || this.getSelected(),
				prev = current.$el.prev().data('view');

			if ( _.isUndefined( prev ) && ! current.parent().is( Grid ) ) {
				prev = current.parent();
			} else if (! _.isUndefined( prev ) && ! prev.is( Widget ) ) {
				prev = prev.$('.widget').last().data('view')
			}
			if ( ! features.locks && prev && prev.model.get( 'locked' ) ) {
				return this.getPrevItem( prev );
			}
			return prev;
		},
		getNextItem: function( current ) {
			var next,
				current = current || this.getSelected();

			if ( current.$('>.collection').children().length ) {
				next = current.$('>.collection>*').first().data('view');
			} else {
				next = current.$el.next().data('view');
			}

			if ( _.isUndefined( next ) ) {
				while ( _.isUndefined( next ) && ! current.is( Grid ) ) {
					current = current.parent();
					next = current.$el.next().data('view');
				}
			}
			if ( ! features.locks && next && next.model.get( 'locked' ) ) {
				return this.getNextItem( next );
			}
			return next;
		},


		toggleLockState: function( ) {
			var item = this.getSelected(),
				oldState;
			if ( !! item ) {
				oldState = !! item.model.get( 'locked' );
				item.model.set( 'locked', !oldState );
				this.reFocus()
			}
			this.toolbar.update();
		},
		
		editItem: function( e ) {
			e && e.preventDefault();

			if ( $( 'body' ).hasClass( 'grid-modal-open' ) ) {
				return false;
			}

			var self		= this,
				current		= this.getSelected(),
				next		= this.getNextItem( current ),
				prev		= this.getPrevItem( current ),
				modal		= new Modal( { 
					controller: this,
					next: !! next,
					prev: !! prev,
				} ),
				settings	= options.settings[ current.getClassName().toLowerCase() ],
				editor		= options.editors[ current.getClassName().toLowerCase() ],
				dialog, title = [], currentTitle = current, titleSegment;
//			title = [];

			while ( !! currentTitle && ! currentTitle.is( Grid ) ) {
				titleSegment = currentTitle.is( Widget ) ? options.widgets[ currentTitle.model.get('widget_class') ].name : l10n[ currentTitle.getClassName() ];
				title.unshift( titleSegment );
				currentTitle = currentTitle.parent();
			}
//			console.log(currentTitle.is);return;
			dialog		= new grid.view.EditDialog( { 
				title: title.join( ' › ' ),
				controller: this , 
				model: current.model, 
				item: current,
				settings: settings, 
				editor: editor 
			} );

			dialog.on( 'done', function(){
				self.grid.hasChanged();
				modal.close();
			}, modal );
			
			modal
				.on('close',function( e ) {
					dialog.dismiss();
					self.getSelected().$el.focus();
				})
				.on('next',function( e ) {
					dialog.applyChanges();
					self.grid.hasChanged();
					modal.close();
					self.setSelected( next );
					self.editItem( e );
				})
				.on('prev',function( e ) {
					dialog.applyChanges();
					self.grid.hasChanged();
					modal.close();
					self.setSelected( prev );
					self.editItem( e );
				});
			modal.content( dialog ).open();
			modal.$el.focus();
			return false;
		},
		deleteItem: function( e ) {
			e && e.preventDefault();

			var current = this.getSelected(),
				parent = current.parent(),
				itemClass = parent.getClass();

			current.remove();
			parent.model.items.remove( current.model );

			this.grid.hasChanged();

			return false;
		},
		reFocus: function() {
			var item = this.getSelected();
			!! item && item.reFocus();
		},
// 		lockItem: function( e ) {
// 			var current = this.getSelected();
// 			current.model.set( 'locked', $(e.target).is( ':checked' ) );
// 			e.preventDefault();
// 		},
		
		setVisible: function( visibility ) {
			var current = this.getSelected(),
				prop = 'visibility_' + this.toolbar.whichView();
			if ( current ) {
				current.model.set( prop, visibility );
				current.reFocus()
			}
		},

		/**
		 *	TEMPLATES
		 */
		createTemplate: function( ) {
			// get selection
			var self = this,
				current = this.getSelected(),
				template = new grid.model.GridTemplate(),
				prompt = new grid.view.ui.Prompt( {
					title: l10n.TemplateName,
					description: l10n.CreateTemplateDescription,
					defaultValue: l10n[ current.getClassName() ] + ' ' + l10n.Template
				} );

			prompt.on( 'confirm', function( e ) {
				var name = prompt.getValue(),
					slug = grid.utils.sanitizeTitle( name ),
					type = current.getClassName().toLowerCase();

				// ask for name
				template.set( 'name', name );
				template.set( 'slug', slug );
				template.set( 'type', type );
				template.set( 'data', current.model.toJSON() );
			

				// save json
				template.once('sync', function() {
					var slug = template.get('slug');
					template.set( 'id', slug );
					// set item template
					current.model.set( 'template', slug );

					// add to template select
					grid.templates[type].add( template );

					toolbar.update();

					self.grid.hasChanged();
				})
				template.save();
				current.reFocus();
			}, this ).open();

			return false;
		},

		updateTemplate: function() {
			// find the template
			var current = this.getSelected(),
				type = current.getClassName().toLowerCase(),
				slug = current.model.get( 'template' );
			template = grid.templates.get( type, slug );
			template.set( 'data', current.model.toJSON() );
			template.save();
			current.reFocus();
			return false;
		},

		openTemplateManager: function( ) {
			// find the template

			var self = this,
				modal = new wp.media.view.Modal( { controller: this } ),
				current = this.getSelected(),
				dialog = new grid.view.ManageTemplatesDialog( { controller: this, title: l10n.ManageTemplates } );

			dialog.on( 'done', function(){
				modal.close();
			}, modal );

			modal
				.content( dialog )
				.on('close',function( e ) {
					self.toolbar.setupTemplateSelects();
					!!current && current.$el.focus();
				})
				.open();

			return false;
		}


	});

	_.extend(grid, {
		getActiveEditor: function() {
			return active_editor;
		},
		setActiveEditor: function( editor ) {
			active_editor = editor;
		},
	});

})(jQuery,window)