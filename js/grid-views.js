(function( $, grid ){

	var Prompt, Grid, Container, Row, Cell, Widget,
		l10n		= gridbuilder.l10n,
		options		= gridbuilder.options,
		sizekeys 	= {},
		offsetkeys	= {},
		uuid		= 1,
		allObjects	= [];
		
	_.each( options.screensizes.sizes, function( siteOptions, size ) {
		sizekeys[size]		= 'size_' + size;
		offsetkeys[size]	= 'offset_' + size;
	});
	_.templateSettings = {
		interpolate: /\{\{(.+?)\}\}/g
	};
	options.screensizes.size_class_template = _.template( 'col-{{screensize}}-{{size}}' );
	options.screensizes.offset_class_template = _.template( 'col-{{screensize}}-offset-{{size}}' );

	var Prompt = grid.view.Prompt = wp.media.View.extend({
		tagName:    'div',
		className: 'grid-prompt',
		template: wp.template('grid-prompt'),
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


	var SelectorDisplay = wp.media.View.extend({
		tagName:    'div',
		className:  'display-selector',
		initialize: function( options ) {
			this.model = options.model;
			this.listenTo(this.model,'change',this.render);
		},
		render: function() {
			var id = this.model.get('attr_id'),
				classname = this.model.get('attr_class'),
				selector = '';

			if ( !!id ) {
				selector += '<span class="display-id">#' + id + '</span>';
			}
			if ( !!classname ) {
				selector += '<span class="display-class">.' + classname.split(' ').join('.') + '</span>';
			}
			this.$el.html(selector);

			return this;
		}
	});
	var TemplateDisplay = wp.media.View.extend({
		tagName:    'div',
		className:  'display-template',
		initialize: function( options ) {
			this.model = options.model;
			this.listenTo(this.model,'change',this.render);
		},
		render: function() {
			var template = this.model.get('template'),
				selector = '';
			if ( !!template ) {
				selector += l10n.Template+': '+template;
			}
			this.$el.text(selector);

			return this;
		}
	});

	var TitleDisplay = wp.media.View.extend({
		tagName:    'div',
		className:  'display-title',
		initialize: function( options ) {
			this.model = options.model;
			this.listenTo(this.model,'change',this.render);
		},
		render: function() {
			var title = this.model.get('title'),
				subtitle = this.model.get('subtitle'),
				selector = '';

			if ( !! title ) {
				selector += title;
			}
			if ( !! subtitle ) {
				selector += ' <small>'+subtitle+'</small>';
			}
			this.$el.html(selector);

			return this;
		}
	});
	var CollectionView = wp.media.View.extend({
		initialize: function( options ) {
			var self = this, template;
			
			this.Subviews	= wp.Backbone.Subviews;
			this.options	= options;
			this.controller	= options.controller;
			this.model 		= options.model;
			this.controller.subviews.add( this );
			this.templateDisplay = new TemplateDisplay({ model: this.model });
			this.selectorDisplay = new SelectorDisplay({ model: this.model });

			this.listenTo( this.model, 'change', this.updateDisplay );

			// check if template still exists
			
			template = this.model.get( 'template' );
			if ( template && ! grid.templates.get( this.getClassName(), template ) ) {
				this.model.unset( 'template' );
			}
			
			allObjects.push( this );

			return this;
		},
		remove: function(){
			// update model
			var idx = allObjects.indexOf(this);
			allObjects.splice( idx, 1 );
			this.$el.remove();
		},
		render:function() {
			wp.media.View.prototype.render.apply( this, arguments );
			var self = this,
				cls = this.collectionView(),
				$collection = this.$('>.collection');
			this.$el.data( 'model', this.model );
			this.$el.data( 'view', this );
			$collection.data( 'model', this.model.items );
			if ( cls ) {
				this.model.items.each( function( item, i ) {
					var cnt = new cls({ controller: self.options.controller, model: item, parent: self });
					$collection.append( cnt.$el );
					cnt.render();
				});
			}
			this.$el.prepend( this.selectorDisplay.render().$el );
			this.$el.prepend( this.templateDisplay.render().$el );

			this.$el.on('click',function( e ) {
				if (e.target == e.currentTarget || e.target.parentNode == e.currentTarget ) {
					self.closest( Grid ).setSelected( self );
				}
			});

			this.updateDisplay();

			return this;
		},
		updateDisplay: function() {
			this.updateVisibilityClasses();
		},
		setVisibility: function( visibility ) {
			var gridView = this.controller.view,
				viewSize = gridView.whichView(),
				prop = 'visibility_' + viewSize;
			this.model.set( prop, visibility );
			gridView.hasChanged();
		},
		updateVisibilityClasses: function() {
			var self = this,
				addClass = [],
				removeClass = [];
			_.each( options.screensizes.sizes, function( size, viewSize ) {
				var vis = self.model.get( 'visibility_' + viewSize ),
					visibleClass = 'visible-' + viewSize,
					hiddenClass  = 'hidden-' + viewSize;
				if ( vis === 'visible' ) {
					addClass.push( visibleClass );
					removeClass.push( hiddenClass );
				} else if ( vis === 'hidden' ) {
					addClass.push( hiddenClass );
					removeClass.push( visibleClass );
				} else {
					removeClass.push( visibleClass );
					removeClass.push( hiddenClass );
				}
			});
			this.$el.removeClass( removeClass.join(' ') ).addClass( addClass.join(' ') );
			return this;
		},
		detach:function( ){
		},
		is: function( what ) {
			return this.constructor === what;
		},
		closest: function( what ) {
			var current = this;
			while ( !! current && ! current.is( what ) ) {
				current = current.parent();
			}
			return current;
		},
		parent: function() {
			return this.options.parent;
		},
		getClass: function() {
			return this.constructor;
		},
		getClassName: function() {
			var self = this,
				results = _.filter( ['Grid','Container','Row','Cell','Widget'], function( className ) {
					return self.is( eval( className ) );
				});
			return results.length ? results[0] : false;
		},
		hasChanged: function() {
			this.closest(Grid).hasChanged( );
		}
	});
	Modal = grid.view.Modal = wp.media.view.Modal.extend({
		template: wp.template('grid-media-modal'),
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

	Widget = grid.view.Widget = CollectionView.extend({
		template: wp.template('widget-view'),
		className:'widget',
		tagName:'li',

		updateDisplay: function() {
			CollectionView.prototype.updateDisplay.apply( this, arguments );
			this.$('.widget-type').text( options.widgets[ this.model.get('widget_class') ].name );

			var title = this.model.get('instance').title;
			this.$('.widget-title').text(title);
			return this;
		},
		collectionView: function(){ return false }
	});

	Cell = grid.view.Cell = CollectionView.extend({
		template: wp.template('cell-view'),
		className:'cell',
		tagName:'li',

		render: function(){
			CollectionView.prototype.render.apply(this,arguments);

			var self = this,
				dragStartX, dragStartY, startOffset;

			_.each( sizekeys, function( sizekey, viewSize ) {
				var size = self.model.get( sizekey );
				if ( !! size ) {
					self.setColClass( size, viewSize );
				}
			} );
			_.each( offsetkeys, function( offsetkey, viewSize ) {
				var offset = self.model.get( offsetkey );
				if ( !! offset ) {
					self.setOffsetClass( offset, viewSize );
				}
			} );

			this.$('.resize-handle, .offset-handle')
 				.on('dragstart',function( event ) {
 					dragStartX = event.originalEvent.clientX,
 					dragStartY = event.originalEvent.clientY,
 					startOffset = self.getCurrentOffset();

 					event.stopImmediatePropagation();

					// setup inivisible drag image
					var cnv = $('<canvas class="drag-resize-image"></canvas>')
						.attr( 'width', '20' )
						.attr( 'height', '20' )
						.appendTo('body')
						.get(0),
						ctx = cnv.getContext("2d");

					ctx.fillStyle = 'rgba(0,0,0,0)';
					ctx.fillRect( 0, 0, cnv.width, cnv.height );
					event.originalEvent.effectAllowd = 'move';
 					event.originalEvent.dataTransfer.setDragImage( cnv, cnv.width / 2, cnv.height / 2 );
				})

			this.$('.resize-handle')
				.on( "drag", function( event ) {
					var colWidth	= $(this).closest('.row').width() / 12,
						viewSize	= self.controller.whichView(),
						cols		= Math.max( 1, Math.min( 12, Math.round( ( event.originalEvent.pageX - self.$el.offset().left ) / colWidth ) ) ),
						prevCols	= self.model.get( 'size_'+viewSize );

					if (prevCols != cols) {
						self.setColClass( cols, viewSize );
						self.model.set( 'size_'+viewSize, cols );
						self.hasChanged();
					}

					event.stopImmediatePropagation();
				} );

			this.$('.offset-handle')
 				.on('drag',function( event ) {
					var colWidth	= $(this).closest('.row').width() / 12;
						viewSize	= self.controller.whichView(),
						diff 		= dragStartX - event.originalEvent.clientX;
						offsetDiff	= Math.round( diff / colWidth ),
						offset		= Math.min( 11, Math.max( 0, startOffset - offsetDiff ) ),
						prevOffset	= self.model.get( 'offset_' + viewSize );

					if ( prevOffset != offset ) {
						self.setOffsetClass( offset, viewSize );
						self.model.set( 'offset_'+viewSize, offset );
						self.hasChanged();
					}

					event.stopImmediatePropagation();
				})

    		return this;
		},
		setColClass: function( size, viewSize ) {
			var className = options.screensizes.size_class_template({ screensize: viewSize, size: size });
			this.$el.removeClass( this.getColClassnames( viewSize ).join(' ') ).addClass( className );
    		return this;
		},
		getCurrentOffset: function() {
			var viewSize = this.controller.whichView(),
				self = this, offset, did = false;

			offset_key = _.find( offsetkeys, function(prop,size) {
				if ( size == viewSize ) {
					did = true;
				}
				return did && !! self.model.get( prop )
			});
			return self.model.get( offset_key ) || 0;
		},
		setOffsetClass: function( offset, viewSize ) {
			var className = options.screensizes.offset_class_template({ screensize: viewSize, size: offset });
			this.$el.removeClass( this.getColClassnames( viewSize, options.screensizes.offset_class_template ).join(' ') ).addClass( className );
    		return this;
		},
		getColClassnames: function( viewsize, class_template ) {
			if ( 'undefined' === typeof class_template ) {
				class_template = options.screensizes.size_class_template;
			}
			var cls = [];
			for (var i=0;i<13;i++) {
				cls.push( class_template({ screensize:viewsize,size:i }) );
			}
			return cls;
		},
		collectionView: function(){ return Widget },
	}, CollectionView );

	Row = grid.view.Row = CollectionView.extend({
		template: wp.template('row-view'),
		className:'row',
		tagName:'li',
		
		initialize: function(){
			CollectionView.prototype.initialize.apply( this, arguments );
			var self = this;
			this.listenTo( this.model.items, 'update', this.adjustCellSize, this );
			this.model.items.each( function( item ) {
				self.listenTo( item.items, 'update', self.adjustCellSize, self );
			});
			
			return this;
		},
		render: function(){
			CollectionView.prototype.render.apply( this, arguments );
			var self = this;
			setTimeout(function(){self.adjustCellSize();},1);
			return this;
		},
		adjustCellSize: function() {
			var $cells = this.$('.cell');
			var cellHeight = 0;
			$cells.each( function(i,el){
				$(this).removeAttr( 'style' );
				cellHeight = Math.max(cellHeight, $(this).height() );
			} );
			$cells.each( function(){
				$(this).css( { 'height':cellHeight+'px' } ); 
			} );
			return this;
		},
		collectionView: function(){ return Cell },
	});

	Container = grid.view.Container = CollectionView.extend({
		template: wp.template('container-view'),
		className:'container',
		tagName:'li',
		events: {
			'click .toggle-collapse': 'toggleCollapsed'
		},
		initialize: function() {
			CollectionView.prototype.initialize.apply( this, arguments );
			this.titleDisplay = new TitleDisplay({ model: this.model });			
			return this;
		},
		render: function(){
			CollectionView.prototype.render.apply( this, arguments );
			this.$el.prepend( this.titleDisplay.render().$el );
			this.setCollapsed( this.model.get('collapsed') );
			return this;
		},
		collectionView: function(){ return Row },
		toggleCollapsed: function( e ) {
			var state = !this.model.get('collapsed');
			this.setCollapsed( state );
			e.preventDefault();
		},
		setCollapsed: function( state ) {
			this.$el.toggleClass( 'collapsed', !!state );
			this.model.set('collapsed', !!state );
			this.$('>.collection .row').each(function(){
				$(this).data('view').adjustCellSize();
			});
		}
	});

	Grid = grid.view.Grid = CollectionView.extend({
		template: wp.template('grid-view'),
		className:'grid-view',
		tagName:'div',
		events: {
			'click .viewswitcher [type="radio"]':		'switchView',
			'click .set-visibility [type="radio"]':		'setItemVisibility',

			'change select.add-container':				'addContainer',
			'change select.add-row':					'addRow',
			'change select.add-cell':					'addCell',
			'change select.add-widget':					'addWidget',
			
			'click button.add-container':				'addContainer',
			'click button.add-row':						'addRow',
			'click button.add-cell':					'addCell',
			'click button.add-widget':					'addWidget',
			
			'click .grid-toolbar .edit':				'editItem',
			'click .grid-toolbar .clone':				'cloneItem',
			'click .grid-toolbar .delete':				'deleteItem',

			'click .grid-toolbar .create-template':		'createTemplate',
			'click .grid-toolbar .update-template':		'updateTemplate',
			'click .grid-toolbar .manage-templates':	'manageTemplates'
			
		},
		initialize: function(){
			CollectionView.prototype.initialize.apply( this, arguments );
			this.selectWidgetModal = null;
			this.templateSelectOptions = [];

			this.on( 'change_viewsize', this.updateVisibilitySelect, this );
			this.on( 'select', this.updateVisibilitySelect, this );
		},
		render: function(){
			CollectionView.prototype.render.apply( this, arguments );

			this.setupViewswitcher();

			// set view size
			var viewSize = window.getUserSetting( 'grid-view-size' );

			if ( !!viewSize ) {
				this.$('.viewswitcher [value="'+viewSize+'"]').prop('checked',true);
			} else {
				this.$('.viewswitcher [type="radio"]:last').prop('checked',true);
			}
			this.switchView();

			this.initSortables()

			this.setSelected( this );
			
			this.renderTemplateSelects();

			this.setupToolbar();

			return this;
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

		switchView: function( ) {
			var newView = this.whichView(),
				oldView = this.$el.attr( 'data-view-size' ),
				changed = oldView != newView;
			if ( newView ) {
				this.$el.attr('data-view-size', newView );
				this.trigger( 'change_viewsize', this );
				// store in user settings
				window.setUserSetting( 'grid-view-size', newView );
			}
		},

		whichView: function(){
			return this.$('.viewswitcher :checked').val();
		},

		setupToolbar: function() {
			var self = this;

			this.updateToolbarWidth();

			$(window).on('scroll',function() {
				var oldState = self.$('.grid-toolbar').attr('data-sticky') === 'true',
					newState = ( $(window).scrollTop() + 33 ) >= self.$el.offset().top;
				if ( oldState != newState ) {
					self.$('.grid-toolbar').attr( 'data-sticky', newState.toString() );
				}
			});
			$(window).on('resize',function() {
				self.updateToolbarWidth();
			})
		},
		updateToolbarWidth: function() {
			this.$('.grid-toolbar').css( 'width', this.$el.width().toString() + 'px' );
		},
		renderTemplateSelects: function(){
			var self = this; 
			
			_.each( this.templateSelectOptions, function( option ){
				option.stopListening();
				option.remove();
				self.stopListening( option.model );
			});

			_.each([ 'container', 'row', 'cell', 'widget' ], function( type ) {
				var $select = self.$('select.add-'+type);
				grid.templates[type].each( function( model ) {
					var value = model.get( 'slug' ),
						option = new Backbone.View({
							tagName: 'option',
							attributes: {
								value: value
							},
							model: model
						});
					option.render().$el.text( model.get( 'name' ) );
					$select.append( option.$el );
					option.listenTo( model, 'change', function() {
						this.$el.text( this.model.get('name') );
					} );
					self.listenTo( model, 'destroy', function(){
						var hasChanged = false;
						_.each( allObjects, function( obj, i ) {
							if ( obj.model.get('template' ) === model.id ) {
								obj.model.unset('template' );
								hasChanged = true;
							}
						});
						hasChanged && self.hasChanged();
					});
					self.templateSelectOptions.push( option );
				});
			});
		},
		
		initSortables: function() {
			var groups = [ 'container', 'row', 'cell', 'widget' ], sortoptions = {
				ghostClass: 'ghost',
				scroll: true
			}, self = this;
			_.each( groups, function( group ) {
				var options = $.extend({
						group: group,
					}, sortoptions ),
					$sortable = $( '[data-sort-group="'+group+'"]' )
						.sortable( options )
						.on( 'add', function( e ) {
							$(this).data('model').add( $(e.originalEvent.item).data('model') );
							e.stopPropagation();
							self.hasChanged();
						} )
						.on( 'remove', function( e ) {
							$(this).data('model').remove( $(e.originalEvent.item).data('model') );
							e.stopPropagation();
							self.hasChanged();
						} )
						.on('sort',function(e) {
							$(this).children().each(function(i,el){
								var elModel = $(el).data('model');
								elModel.set('idx',i);
							});
							$(this).data('model').sort();
							e.stopPropagation();
							self.hasChanged();
	//						updateCellHeights();
						});

			});
		},
		
		getSelected: function() {
			return this.options.controller.getSelected(this);
		},
		setSelected:function( item ) {
			var gridView = this.controller.view;
			this.options.controller.setSelected( item );

			$('.current-grid-item').removeClass('current-grid-item')
			item.$el.addClass('current-grid-item');

			// update toolbar
			if ( item.is( Grid ) ) {
				gridView.$('.item-action').prop( 'disabled',true );
			} else if ( item.is( Container ) ) {
				gridView.$('.item-action').prop( 'disabled', false );
			} else if ( item.is( Row ) ) {
				gridView.$('.item-action').prop( 'disabled', false );
			} else if ( item.is( Cell ) ) {
				gridView.$('.item-action').prop( 'disabled', false );
			} else if ( item.is( Widget ) ) {
				gridView.$('.item-action').prop( 'disabled', false );
			}

 			gridView.$('.add-row').prop( 'disabled', ! item.closest( Container ) );
 			gridView.$('.add-cell').prop( 'disabled', ! item.closest( Row ) );
 			gridView.$('.add-widget').prop( 'disabled', ! item.closest( Cell ) );

 			gridView.$('.create-template').prop( 'disabled', item.is( Grid ) );
 			gridView.$('.update-template').prop( 'disabled', item.is( Grid ) || ! item.model.get( 'template' ) );

 			gridView.$('.set-visibility').toggleClass( 'hidden', item.is( Grid ) );

 			this.trigger( 'select' );

			return this;
		},
		setItemVisibility: function( e ) {
			var current = this.getSelected();
			if ( !! current ) {
				current.setVisibility( this.$('[name="set-visibility"]:checked').val() );
			}
		},

		updateVisibilitySelect: function() {
			var current = this.getSelected(),
				visiValue;

			if ( !!current && ! current.is( Grid ) ) {
				visiValue = current.model.get( 'visibility_' + this.whichView() ) || '';
	 			this.$('[name="set-visibility"][value="' + visiValue + '"]').prop( 'checked', true );
	 		}
		},
		
		collectionView: function(){ return Container },

		hasChanged: function() {
			this.model.trigger( 'change', this.model );
		},


		/**
		 *	Managing items
		 */
		addContainer:function( e ) {
			var template = $(e.target).is('select') ? grid.templates.get( 'container', $(e.target).val() ) : false,
				val = template ? template.get('data') : {};
			
			if ( template ) {
				$(e.target).val('');
				val.template = template.get('slug');
			}
			
			this._addItem( Container, this, val );
			
			return false;
		},
		addRow: function( e ) {
			var current	= this.getSelected(),
				parent	= current.closest(Container),
				template = $(e.target).is('select') ? grid.templates.get( 'row', $(e.target).val() ) : false,
				val = template ? template.get('data') : {};

			if ( !! template ) {
				$(e.target).val('');
				val.template = template.get('slug');
			}
			
			this._addItem( Row, parent, val );

			$(e.target).val('');

			return false;
		},
		addCell: function( e ) {
			var current	= this.getSelected(),
				parent	= current.closest(Row),
				template = $(e.target).is('select') ? grid.templates.get( 'cell', $(e.target).val() ) : false,
				val = template ? template.get('data') : { size_xs: 12 };

			if ( template ) {
				$(e.target).val('');
				val.template = template.get('slug');
			}			

			this._addItem( Cell, parent, val );

			return false;
		},
		addWidget: function( e ) {
			var self		= this,
				current		= this.getSelected(),
				parent		= current.closest( Cell ),
				template	= $(e.target).is('select') ? grid.templates.get( 'widget', $(e.target).val() ) : false,
				val			= template ? template.get('data') : { instance: {} },
				model		= new Backbone.Model(), dialog;

			if ( template ) {
				$(e.target).val('');
				val.template = template.get('slug');
				this._addItem( Widget, parent, val );
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
						self._addItem( Widget, parent, val ).editItem( );
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

			var current = this.getSelected(),
				data = data || {},
				itemModel = new grid.model.GridObject( data ),
				item = new itemClass({
					controller:	this.controller,
					model:		itemModel,
					parent:		parent
				});
			if ( ! current )
				current = this;
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


			$collection.trigger('sort');

			this.hasChanged();
			this.initSortables();

			this.setSelected( item );
			
			return this;
		},
		getPrevItem: function( current ) {
			var prev;
			current = current || this.getSelected();
			prev = current.$el.prev().data('view');

			if ( _.isUndefined( prev ) && ! current.parent().is( Grid ) ) {
				prev = current.parent();
			} else if (! _.isUndefined( prev ) && ! prev.is( Widget ) ) {
				prev = prev.$('.widget').last().data('view')
			}
			return prev;
		},
		getNextItem: function( current ) {
			var next;
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

			return next;
		},
		editItem: function( e ) {
			e && e.preventDefault();

			var self		= this,
				current		= this.getSelected(),
				next		= this.getNextItem( current ),
				prev		= this.getPrevItem( current ),
				modal		= new grid.view.Modal( { 
					controller: this,
					next: !! next,
					prev: !! prev,
				} ),
				settings	= options.settings[ current.getClassName().toLowerCase() ],
				editor		= options.editors[ current.getClassName().toLowerCase() ],
				dialog, title, currentTitle = current;
			title = [];
			while ( ! currentTitle.is(Grid ) ) {
				title.unshift( currentTitle.is( Widget ) ? options.widgets[ currentTitle.model.get('widget_class') ].name : l10n[ currentTitle.getClassName() ] )
				currentTitle = currentTitle.parent();
			}
			dialog		= new grid.view.EditDialog( { 
				title: title.join( ' › ' ),
				controller: this , 
				model: current.model, 
				settings: settings, 
				editor: editor 
			} );

			dialog.on( 'done', function(){
				self.hasChanged();
				modal.close();
			}, modal );
			
			modal
				.on('close',function( e ) {
					dialog.dismiss();
				})
				.on('next',function( e ) {
					self.hasChanged();
					modal.close();
					self.setSelected( next );
					self.editItem( e );
				})
				.on('prev',function( e ) {
					self.hasChanged();
					modal.close();
					self.setSelected( prev );
					self.editItem( e );
				});

			modal.content( dialog ).open();

			return false;
		},
		deleteItem: function( e ) {
			e.preventDefault();

			var current = this.getSelected(),
				parent = current.parent(),
				itemClass = parent.getClass();

			current.remove();
			parent.model.items.remove( current.model );

			this.setSelected(this);

			this.hasChanged();

			return false;
		},
		

		/**
		 *	TEMPLATES
		 */
		createTemplate: function( e ) {
			// get selection
			var self = this,
				current = this.getSelected(),
				template = new grid.model.GridTemplate(),
				prompt = new grid.view.Prompt( {
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
					self.renderTemplateSelects();

					self.hasChanged();
				})
				template.save();
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
			console.log(template);return false;
			return false;
		},
		manageTemplates: function( e ) {
			// find the template
			e.preventDefault();

			var self = this,
				modal = new wp.media.view.Modal( { controller: this } ),
				current = this.getSelected(),
				dialog = new grid.view.ManageTemplatesDialog( { controller: this, title: l10n.ManageTemplates } );

			dialog.on( 'done', function(){
				modal.close();
			}, modal );
			modal.content( dialog ).open();

			return false;
		}
		
	});

})(jQuery,window.grid)