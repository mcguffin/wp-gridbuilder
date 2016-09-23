(function( $, grid ){
	
	if ( !! document.caretPositionFromPoint && ! document.caretRangeFromPoint ) {
		document.caretRangeFromPoint = document.caretPositionFromPoint;
	}
	
	var Grid, Container, Row, Cell, Widget,
		CollectionView, 
		SelectorDisplay, TemplateDisplay,
		classMap,
		l10n		= gridbuilder.l10n,
		options		= gridbuilder.options,
		features	= gridbuilder.options.features,
		sizekeys 	= {},
		offsetkeys	= {},
		uuid		= 1,
		allObjects	= [],
		
		active_editor;

	_.each( options.screensizes.sizes, function( siteOptions, size ) {
		sizekeys[size]		= 'size_' + size;
		offsetkeys[size]	= 'offset_' + size;
	});
	_.templateSettings = {
		interpolate: /\{\{(.+?)\}\}/g
	};
	options.screensizes.size_lock_template		= _.template( 'col-{{screensize}}-lock' );
	options.screensizes.offset_lock_template	= _.template( 'col-{{screensize}}-offset-lock' );
	options.screensizes.size_class_template		= _.template( 'col-{{screensize}}-{{size}}' );
	options.screensizes.offset_class_template	= _.template( 'col-{{screensize}}-offset-{{size}}' );



	



	SelectorDisplay = wp.media.View.extend({
		tagName:    'div',
		className:  'display-selector',

		initialize: function( options ) {
			this.model = options.model;
			this.listenTo(this.model,'change',this.render);
		},
		render: function() {
			var id 			= this.model.get('attr_id'),
				classname	= this.model.get('attr_class'),
				locked		= this.model.get('locked'),
				selector	= '';

			if ( !!id ) {
				selector += '<span class="display-id">#' + id + '</span>';
			}
			if ( !!classname ) {
				selector += '<span class="display-class">.' + classname.split(' ').join('.') + '</span>';
			}
			if ( locked ) {
				selector += '<span class="dashicons dashicons-lock"></span>';
			}
			this.$el.html(selector);

			return this;
		}
	});
	TemplateDisplay = wp.media.View.extend({
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




	CollectionView = wp.media.View.extend({
		events: {
//			'click *' 	: 'clickSelect',
			'focusin' 	: 'focusin',
			'focusout' 	: 'focusout',
			'dblclick'	: 'edit'
		},
		initialize: function( options ) {
			var self = this, template;
			
			this.Subviews	= wp.Backbone.Subviews;
			this.options	= options;
			this.controller	= options.controller;
			this.model 		= options.model;
//			this.controller.subviews.add( this );
			this.templateDisplay = new TemplateDisplay({ model: this.model });
			this.selectorDisplay = new SelectorDisplay({ model: this.model });

			this.listenTo( this.model, 'change', this.updateDisplay );

// 			this.listenTo( this.model.items, 'add', this.render );
// 			this.listenTo( this.model.items, 'remove', this.render );

			// check if template still exists
			
			template = this.model.get( 'template' );
			if ( template && ! grid.templates.get( this.getClassName(), template ) ) {
				this.model.unset( 'template' );
			}

			allObjects.push( this );
			
			this.$el.data( 'view', this );

			return this;
		},
		edit: function( e ) {
			if ( features.locks || !this.model.get( 'locked' ) ) {
				this.controller
					.setSelected( this )
					.editItem();
				e.stopPropagation();
			}
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

			if ( ! features.locks && this.model.get('locked') ) {
				this.$el.addClass('locked');
			} else {
				this.$el.addClass('unlocked');
			}
				
			$collection.html('');
			this.$el.data( 'model', this.model );
//			this.$el.data( 'view', this );
			$collection.data( 'view', this ).data( 'model', this.model.items );
			if ( cls ) {
				this.model.items.each( function( item, i ) {
					var cnt = new cls( { 
						controller: self.options.controller, 
						model: item, 
						parent: self 
					});
					$collection.append( cnt.$el );
					cnt.render();
				});
			}
			this.$el.prepend( this.selectorDisplay.render().$el );
			this.$el.prepend( this.templateDisplay.render().$el );

// 			this.$el.on( 'click', function( e ) {
// 				if ( e.target == e.currentTarget || e.target.parentNode == e.currentTarget ) {
// 					self.closest( Grid ).setSelected( self );
// 				}
// 			});
			this.updateDisplay();

			return this;
		},
// 		clickSelect: function(e) {
// 			if ( this.$el.children().get().indexOf(e.target) !== -1 ) {
// 				this.closest( Grid ).setSelected( this );
// 			}
// 			e.stopPropagation();
// 			e.preventDefault();
// 		},
		reFocus: function( ){
			this.$el.focus();
		},
		
		/*
		focusUnselect: function(e) {
			this.controller.setSelected( null );
		},
		focusSelect: function(e) {
			if (e.target === this.el) {
	 			this.controller.setSelected( this );
				e.stopPropagation();
				e.preventDefault();
  			}
		},
		/*/
		focusin: function(e) {
		},
		focusout: function(e) {
		},
		//*/
		updateDisplay: function() {
			this.updateVisibilityClasses();
		},
		setVisibility: function( visibility ) {
			var gridView = this.controller.view,
				viewSize = this.controller.toolbar.whichView(),
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
		detach:function( ) {
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
					return self.is( classMap[ className ] );
				});
			return results.length ? results[0] : false;
		},
		hasChanged: function() {
			this.closest(Grid).hasChanged( );
		},
		getTitle: function() {
			return l10n[ this.getClassName() ];
		}
	});

	Widget = grid.view.element.Widget = CollectionView.extend({
		template: wp.template('grid-element-widget'),
		className:'widget grid-item',
		tagName:'li',
		attributes: {
			'tabindex': 0
		},

		updateDisplay: function() {
			CollectionView.prototype.updateDisplay.apply( this, arguments );
			this.$('.widget-type').text( this.getTitle() );

			var title = this.model.get('instance').title;
			this.$('.widget-title').text(title);
			return this;
		},
		collectionView: function() { return false },
		getTitle: function( ) {
			var widgetClass = this.model.get('widget_class');
			try {
				return options.widgets[ widgetClass ].name;
			} catch( err ) {
				return l10n.unkonwnWidget + ' ' + widgetClass;
			}
		}
	});

	Cell = grid.view.element.Cell = CollectionView.extend({
		template: wp.template('grid-element-cell'),
		className:'cell grid-item',
		tagName:'li',
		attributes: {
			'tabindex': 0
		},

		initialize: function() {
			var ret = CollectionView.prototype.initialize.apply(this,arguments);
			this.listenTo( this.model.items, 'update', this.itemsChanged );
			return ret;
		},
		itemsChanged: function() {
			// let row adjust cell heights
			this.parent().adjustCellSize();
		},
		render: function() {
			CollectionView.prototype.render.apply(this,arguments);

			var self = this, $dragged, eventProp = 'screenX',
				dragStartX, startOffset;

			_.each( sizekeys, function( sizekey, viewSize ) {
				var size = self.model.get( sizekey );
				if ( !! size ) {
					self.setColClass( size, viewSize );
				}
			} );
			_.each( offsetkeys, function( offsetkey, viewSize ) {
				var offset = self.model.get( offsetkey );
				if ( ! isNaN( parseInt(offset) ) ) {
					self.setOffsetClass( offset, viewSize );
				}
			} );

			// FF does not include pointer position in drag events.
			// need to get back to good old mousemove
			function mousemove( e ) {
				var $e = $.Event( 'drag', {
					pageX: e.pageX,
					pageY: e.pagey,
					screenX: e.screenX,
					screenY: e.screeny,
					clientX: e.clientX,
					clienty: e.clienty
				} );
				$dragged.trigger( $e );
			}
			function mouseup( e ) {
				$(document).off( 'mousemove', mousemove );
				$(document).off( 'mouseup', mouseup );
			}
			if ( features.locks || ! this.model.get('locked') ) {
	
				this.$('.resize-handle, .offset-handle')
					.on( 'mousedown', function( e ) {
						// add move listener
						var viewSize	= self.controller.toolbar.whichView(),
							propname	= ( $(this).is('.offset-handle') ? 'offset_' : 'size_' ) + viewSize;
						if ( features.lock || ! self.model.get( propname+':locked' ) ) {
							dragStartX = e.screenX;
							startOffset = self.getCurrentOffset();
							$dragged = $(this);
							$(document).on( 'mousemove', mousemove );
							$(document).on( 'mouseup', mouseup );
						}
						e.preventDefault();
					} );


				this.$('.resize-handle')
					.on( "drag", function( event ) {
						var colWidth	= $(this).closest('.row').width() / options.screensizes.columns,
							viewSize	= self.controller.toolbar.whichView(),
							cols		= Math.max( 1, Math.min( options.screensizes.columns, Math.round( ( event.pageX - self.$el.offset().left ) / colWidth ) ) ),
							prevCols	= self.model.get( 'size_'+viewSize );

						if ( prevCols != cols ) {
							self.setSize( cols, viewSize );
						}

						event.stopPropagation();
					} );

				this.$('.offset-handle')
					.on('drag',function( event ) {
						var colWidth	= $(this).closest('.row').width() / options.screensizes.columns;
							viewSize	= self.controller.toolbar.whichView(),
							diff 		= dragStartX - event.screenX;
							offsetDiff	= Math.round( diff / colWidth ),
							offset		= Math.min( 11, Math.max( 0, startOffset - offsetDiff ) ),
							prevOffset	= self.model.get( 'offset_' + viewSize );

						if ( prevOffset != offset ) {
							self.setOffset( offset, viewSize );
						}

						event.stopPropagation();
						event.stopImmediatePropagation();
					})
    		}
    		return this;
		},
		getCurrentSize: function() {
			var viewSize = this.controller.toolbar.whichView(),
				self = this, did = false, size = false;

			$.each( sizekeys, function( sizeKey, prop ) {
				var _size = self.model.get( prop );
				if ( ! did && !!_size ) {
					size = parseInt( _size );
				}
				if ( sizeKey == viewSize ) {
					did = true;
				}
			} );

			console.log(size,did);
			return size || options.screensizes.columns ;
		},
		setColClass: function( size, viewSize ) {
			var className = options.screensizes.size_class_template({ screensize: viewSize, size: size });
			this.$el.removeClass( this.getColClassnames( viewSize ).join(' ') ).addClass( className );
    		return this;
		},

		getCurrentOffset: function() {
			var viewSize = this.controller.toolbar.whichView(),
				self = this, did = false, offset = false;

			offset_key = _.find( offsetkeys, function(prop,sizeKey) {
				var _offset = self.model.get( prop );
				if ( ! did && !! _offset ) {
					offset = parseInt( _offset );
				}
				if ( sizeKey == viewSize ) {
					did = true;
				}
			});
			return offset || 0;
		},
		setOffsetClass: function( offset, viewSize ) {
			var className = options.screensizes.offset_class_template({ screensize: viewSize, size: offset });
			this.$el
				.removeClass( this.getColClassnames( viewSize, options.screensizes.offset_class_template ).join(' ') )
				.addClass( className );
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
		getLockClassnames: function( viewsize, class_template ) {
			return '';
		},

		incrementOffset: function() {
			var viewSize = this.controller.toolbar.whichView(),
				offset = this.getCurrentOffset();
			if ( offset < (options.screensizes.columns - 1 ) ) {
				this.setOffset( offset + 1, viewSize );
			}
		},
		decrementOffset: function() {
			var viewSize = this.controller.toolbar.whichView(),
				offset = this.getCurrentOffset();
			if ( offset > 0 ) {
				this.setOffset( offset - 1, viewSize );
			}
		},

		incrementSize: function() {
			var viewSize = this.controller.toolbar.whichView(),
				size = this.getCurrentSize();
			if ( size < options.screensizes.columns ) {
				this.setSize( size + 1, viewSize );
			}
		},
		decrementSize: function() {
			var viewSize = this.controller.toolbar.whichView(),
				size = this.getCurrentSize();
			console.log(size);
			if ( size > 1 ) {
				this.setSize( size - 1, viewSize );
			}
		},
		
		setSize: function( size, viewSize ) {
			this.model.set( 'size_' + viewSize, size );
			this.setColClass( size, viewSize );
			this.hasChanged();
		},
		setOffset: function( offset, viewSize ) {
			this.setOffsetClass( offset, viewSize );
			this.model.set( 'offset_' + viewSize, offset );
			this.hasChanged();
		},
		updateDisplay: function() {
			CollectionView.prototype.updateDisplay.apply( this, arguments );
			this.updateColLockClasses();
		},
		updateColLockClasses: function() {
			var self		= this,
				add_classes	= [],
				rm_classes	= [];
			;

			_.each( options.screensizes.sizes, function( siteOptions, size ) {
				_.each( {	
					'size' : options.screensizes.size_lock_template, 
					'offset' : options.screensizes.offset_lock_template 
				}, function( tpl, prop ) {

					var cls = tpl( { screensize : size } );
					if ( self.model.get( prop + '_' + size + ':locked' ) ) {
						add_classes.push( cls );
					} else {
						rm_classes.push( cls );
					}
				});
			});
			this.$el.removeClass( rm_classes.join(' ') ).addClass( add_classes.join(' ') );
		},
		collectionView: function(){ return Widget },
	}, CollectionView );

	Row = grid.view.element.Row = CollectionView.extend({
		template: wp.template('grid-element-row'),
		className:'row grid-item',
		tagName:'li',
		attributes: {
			'tabindex': 0
		},
		
		initialize: function(){
			CollectionView.prototype.initialize.apply( this, arguments );
			var self = this;
			return this;
		},
		render: function() {
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

	Container = grid.view.element.Container = CollectionView.extend({
		template: wp.template('grid-element-container'),
		className:'container grid-item',
		tagName:'li',
		attributes: {
			'tabindex': 0
		},

		initialize: function() {
			CollectionView.prototype.initialize.apply( this, arguments );
			return this;
		},
		render: function(){
			CollectionView.prototype.render.apply( this, arguments );
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
	Container.prototype.events['click .toggle-collapse' ] = 'toggleCollapsed';

	Grid = grid.view.element.Grid = CollectionView.extend({
		template	: wp.template('grid-element-grid'),
		className	: 'grid-view grid-item',
		tagName		: 'div',
		attributes	: {
			'data-grid-columns': options.screensizes.columns
		},
		events		: {
		},
		initialize: function(){
			CollectionView.prototype.initialize.apply( this, arguments );
			this.selectWidgetModal = null;
			this.templateSelectOptions = [];

		},
		render: function(){
			// set view size
			var viewSize, self = this;

			CollectionView.prototype.render.apply( this, arguments );
			this.$el.removeAttr('tabindex');

			this.initSortables();

			this.controller.setSelected( this );
			return this;
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

			$( '[data-sort-group="cell"]' ).on('add remove', function(e) {
//				console.log('moved widget', this, e );
			});
			_.each( groups, function( group ) {

				var options = $.extend({
						group: group,
						handle: '.sort-handle',
					}, sortoptions ),
					$sortable;

				$sortable = $( '.unlocked>[data-sort-group="'+group+'"]' )
					.sortable( options )
					.on( 'add', function( e ) {
						var collection = $(this).data('model'),
							view = $(this).data('view'),
							itemView = $( e.originalEvent.item ).data( 'view' );

						// update model
 						collection.add( $(e.originalEvent.item).data('model'), { silent: true } );
 						collection.trigger('update');

						// update view
						itemView.options.parent = view;

						e.stopPropagation();
					} )
					.on( 'remove', function( e ) {
						var collection = $(this).data('model');
 						collection.remove( $(e.originalEvent.item).data('model'), { silent: true } );
 						collection.trigger('update');
						e.stopPropagation();
					} )
					.on('sort',function( e ) {
						$(this).children().each(function(i,el){
							var elModel = $(el).data('model');
							elModel.set('idx',i);
						});
						$(this).data('model').sort();
						e.stopPropagation();
					});

			});
		},

		setItemVisibility: function( e ) {
			var current = this.getSelected();
			if ( !! current ) {
				current.setVisibility( this.$('[name="set-visibility"]:checked').val() );
			}
		},

		collectionView: function(){ return Container },

		hasChanged: function() {
			this.model.trigger( 'change', this.model );
		}


		
	});


	classMap	= {
		'Grid'		: Grid,
		'Container'	: Container,
		'Row'		: Row,
		'Cell'		: Cell,
		'Widget'	: Widget
	};
})(jQuery,window.grid)
