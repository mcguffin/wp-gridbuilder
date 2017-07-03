(function( $, grid ){
	var Dialog, InputWrap, InputGroup, TemplatesList, ActiveInput, ParentView, ChildView,
		Grid		= grid.view.Grid, 
		Container	= grid.view.Container, 
		Row			= grid.view.Row, 
		Cell		= grid.view.Cell, 
		Widget		= grid.view.Widget,
		options		= gridbuilder.options,
		features	= gridbuilder.options.features,
		l10n		= gridbuilder.l10n,
		inputTypes	= ['text','textarea','color','number','media','select','checkbox','radio', 'range', 'label'],
		inputs		= {
			inited: false,
		},

		mceZIndex;



	var inputPrototype = {
		render: function( ) {
			wp.media.View.prototype.render.apply(this,arguments);
			var self = this,
				value = ( 'undefined' !== typeof this.options.value && this.options.value !== null ) ? this.options.value : this.options.settings.default;
			this.$el.addClass( 'input-' + this.options.settings.name );
			this.setValue( value );
			switch ( this.options.settings.type ) {
				case 'number':
					_.each( ['min','max','step'], function(attr) {
						if ( typeof self.options.settings[attr] !== 'undefined' ) {
							self.$('[type="number"]').attr( attr, self.options.settings[ attr ] );
						}
					});
					break;
				case 'color':
					this.$('input.color-picker').wpColorPicker({
						hide:true,
						palettes: self.options.settings.palettes
					});
					break;
				case 'media':
					var frame = null;
					this.$('.select-media').on( 'click', function() {
						if ( frame === null ) {
							frame = wp.media({
								title: self.options.settings.title,
								library: { type: self.options.settings.mimetype },
								button: { text: l10n.Done, close: true }
							});
							frame.on( 'select', function(){
								var attachment = frame.state().get('selection').first().attributes, 
									url;
								self.setValue( attachment.id );
							});
						}
						frame.open();
					});
					break;
				case 'range':
					this.$('input').on( 'change', function() { self.updateValue() } );
					break;
			}
			this.updateValue();
			return this;
		},
		updateValue: function() {
			this.$('.display-value').text( this.getValue() );
		},
		setValue: function( value ) {
			var url;
			switch ( this.options.settings.type ) {
				case 'select':
					this.$('select').val( value );
					break;
				case 'radio':
					if ( value === null ) {
						this.$('[type="radio"]:checked').prop('checked', false );
					} else {
						this.$('[type="radio"][value="'+value+'"]').prop('checked', true );
					}
					break;
				case 'checkbox':
					this.$('[type="checkbox"]').prop('checked', !! value );
					break;
				case 'color':
					this.$('input.color-picker').val( value );
					break;
				case 'media':
					this.$('.thumbnail').html( '' );
					if ( !!value ) {
						this.$('[name="media_id"]').val( value );
						var attachment = new wp.media.model.Attachment({id:value}), 
							self = this;
						attachment.once('change',function() {
							var _filename, url
							if ( !! attachment.get('sizes') ) {
								try {
									url = attachment.get('sizes').thumbnail.url;
								} catch ( e ) {
									// We'll use the full image instead
									url = attachment.get('sizes').full.url;
								}
							} else {
								url = attachment.get('icon');
							}
							_filename = new wp.media.View( { tagName:'span', className: 'filename' } );
							_filename.$el.text( attachment.get('title') );

							self.$('.thumbnail').append( 

								$('<img />').attr('src',url), 

								new wp.media.view.Button({ 
									text:l10n.RemoveMedia, 
									click: function(){
										self.setValue(null);
									}
								}).$el.addClass('dashicons dashicons-dismiss'),

								_filename.$el

							);
							delete( attachment );
						});
						attachment.fetch();
					} else {
						this.$('[name="media_id"]').removeAttr( 'value' );
					}
					break;
				case 'textarea':
					this.$('textarea').val( value );
					break;
				default:
					this.$('input').val( value );
					break;
			}
		},
		getValue: function() {
			switch ( this.options.settings.type ) {
				case 'select':
					return this.$('select').val();
				case 'radio':
					return this.$('[type="radio"]:checked').val();
				case 'checkbox':
					return this.$('[type="checkbox"]').prop('checked');
				case 'color':
					return this.$('input.color-picker').val();
				case 'textarea':
					return this.$('textarea').val();
				default:
					return this.$('input').val();
			}
		},
		dismiss: function(){}
	};

	function getInputTypes() {
		if ( ! inputs.inited ) {
			_.each( inputTypes, function( type ) {
				inputs[type]	= wp.media.View.extend( _.extend( {
					template: wp.template( 'grid-ui-input-' + type )
				}, inputPrototype ) );
			});
			inputs.inited = true;
		}
		return inputs;
	}

	ParentView = wp.media.View.extend( {
		initialize: function( options ) {
			wp.media.View.prototype.initialize.apply( this, arguments );
			this.children = [];
		},
		render: function() {
			var self = this;
			wp.media.View.prototype.render.apply( this, arguments );
			_.each(this.children,function(child,i){
				child.render();
				self.$el.append(child.$el);
			});
		}
	} );
	ChildView = ParentView.extend( {
		initialize: function( options ) {
			ParentView.prototype.initialize.apply( this, arguments );
			!!options.parent && options.parent.children.push( this );
		}
	} );

	inputs.widget_instance = wp.media.View.extend( {
		tagName: 'div',
		className: 'widget-instance widget-inside',
		
		initialize: function( ) {
			wp.media.View.prototype.initialize.apply(this,arguments);
			this.$form = $('<form />');
			this.$spinner = $( '<span class="spinner" style="visibility:visible;float:none"></span>' );
//			this.$content = $( '<div class="widget-content"></div>' );
//			this.$form.append( '<span class="spinner" style="visibility:visible;float:none"></span>' );

			this.$el.append( this.$spinner );
			this.$el.append( this.$form );
//			this.$form.append( this.$content );

			this.$widget	= null;

			var self		= this;


			$.ajax({
				method: 'post',
				url: options.ajaxurl,
				complete:function(xhr,status){},
				success: function( data, status, xhr ) {
					self.$spinner.remove();
					self.$widget = $(data);
					self.$form.html('').append( self.$widget );
					self.prepareMCE();
					wp.mediaWidgets.handleWidgetAdded( {}, self.$el.parent() );
					wp.textWidgets.handleWidgetAdded( {}, self.$el.parent() );
//					$(document).trigger( 'widget-added', [ self.$widget ] ); // necessary for tinymce widget
				},
				data: {
					action : 'gridbuilder-get-widget',
					nonce  : options.get_widget_nonce,
					widget_class: this.options.model.get('widget_class'),
					instance: JSON.stringify( this.options.model.get('instance') )
				},
			});
			return this;
		},
		hasMCE: function(){
			return this.getMCE().length > 0;			
		},
		getMCE: function( sel ) {
			var $textareas = this.$( '.mce-tinymce + textarea, .quicktags-toolbar + textarea' ),
				editors = [];
			_.each( tinyMCE.editors, function( ed, i ) {
				$textareas.each(function(i,el){
					if ( el === ed.targetElm ) {
						editors.push( ed );
					}
				})
			} );
			return editors;
		},
		getValue: function() {
			var self = this,
				ret = {};

			// save tinymce.
			_.each( this.getMCE(), function(ed){
				ed.save();
			});

			_.each( this.$form.serializeArray(), function( val ) {
				var name, matches = val.name.match( /\[([a-z0-9-_]+)\]$/g );
				if ( matches ) {
					name = matches.length ? matches[0].replace(/[\[\]]+/g,'') : val.name;
					ret[ name ] = val.value;
				}
			});
			return ret;
		},
		setValue: function( value ) {
			return this;
		},
		dismiss: function() {
			var widgetId = this.$el.parent().find('.widget-inside > form, .widget-inside > .form').find(' > .widget-id').val();
			if ( wp.mediaWidgets.widgetControls[ widgetId ] ) {
				delete( wp.mediaWidgets.widgetControls[ widgetId ] );
			}
			if ( wp.textWidgets.widgetControls[ widgetId ] ) {
				delete( wp.textWidgets.widgetControls[ widgetId ] );
			}

			$(document).trigger( {type:'widget-removed',target: this.$widget } ); // necessary for tinymce widget
			// remove tinymce.
			_.each( this.getMCE(), function(ed){
				tinymce.remove( ed );
			});

			
			this.resetMCE();
			return this;
		},

		prepareMCE: function(){
			var self = this,
				modal = this.$el.closest('.grid-ui-modal').get(0);
			this._prevMCE = {};
			
			if ( ! modal ) {
				return;
			}

			// set tinymce z-index higher than modal z-index
			mceZIndex = 1000 + parseInt( window.getComputedStyle( modal ).getPropertyValue("z-index") );

			// floatpanels (like menus)
			this._prevMCE.FloatPanelZindex = tinyMCE.ui.FloatPanel.zIndex;
			tinyMCE.ui.FloatPanel.zIndex += mceZIndex;

			// tooltips
			this._prevMCE.TooltipRepaint = tinyMCE.ui.Tooltip.prototype.repaint;
			tinyMCE.ui.Tooltip.prototype.repaint = function(){
				self._prevMCE.TooltipRepaint.apply(this,arguments);
				var style = this.getEl().style;
				style.zIndex = mceZIndex + 0xFFFF + 0XFFFF;
			}

			// notifications
			this._prevMCE.NotificationpRepaint = tinyMCE.ui.Notification.prototype.repaint;
			tinyMCE.ui.Notification.prototype.repaint = function(){
				self._prevMCE.NotificationpRepaint.apply(this,arguments);
				var style = this.getEl().style;
				style.zIndex = mceZIndex + 0xFFFF + 0XFFFF;
				console.log(style.zIndex);
			}
			
			// wplink
			if ( !! tinymce.ui.WPLinkPreview ) {
				this._prevMCE.wpLinkRenderHtml = tinymce.ui.WPLinkPreview.prototype.renderHtml;
				tinymce.ui.WPLinkPreview.prototype.renderHtml = function() {
					var ret = self._prevMCE.wpLinkRenderHtml.apply(this,arguments);
					return ret.replace('class="wp-link-preview"','class="wp-link-preview in-grid-modal"');
				}
			}
		},
		resetMCE: function(){
			if ( !! this._prevMCE ) {
				!! this._prevMCE.FloatPanelZindex		&& ( tinyMCE.ui.FloatPanel.zIndex					= this._prevMCE.FloatPanelZindex );
				!! this._prevMCE.TooltipRepaint			&& ( tinyMCE.ui.Tooltip.prototype.repaint			= this._prevMCE.TooltipRepaint );
				!! this._prevMCE.NotificationpRepaint	&& ( tinyMCE.ui.Notification.prototype.repaint		= this._prevMCE.NotificationpRepaint );
				!! this._prevMCE.wpLinkRenderHtml		&& ( tinymce.ui.WPLinkPreview.prototype.renderHtml	= this._prevMCE.wpLinkRenderHtml );
			}
		}
	} );

	ActiveInput =  Backbone.View.extend({
		tagName:'input', 
		attributes:{
			type: 'text',
		},
		events: { 'blur [type="text"]': 'update' },
		initialize: function( options ) {
			this.property = options.property;
			this.model = options.model;
			return this;
		},
		render: function(){
			var self = this;
			Backbone.View.prototype.render.apply(this,arguments);
			this.$el.on('change',function(){ self.update() });
			return this;
		},
		update:function(){
			this.model.set( this.property, this.$el.val() );
			this.model.save();
		}
	});

	TemplatesList = wp.media.View.extend({
		template:  wp.template('grid-ui-templates-list'),
		className: 'templates-list',

		render: function() {
			wp.media.View.prototype.render.apply(this,arguments);
			var self = this;

			this.options.templates.each( function( template, k ) {
				var li = new Backbone.View( { tagName:'li' } ),
					del = new wp.media.view.Button( { 
						model:template,
						text: '', 
						classes: ['delete','dashicons','dashicons-dismiss'], 
						click: function( ) {
							this.options.model.destroy();
							return false;
						} 
					}),
					title = new ActiveInput( { 
						tagName:'input', 
						property: 'name',
						model: template,
						attributes: {
							value: template.get( 'name' ),
							type: 'text'
						}
					});
				li.render().$el.append( title.render().$el, del.render().$el );
				self.$('.templates').append( li.$el );
				
				li.listenTo( template, 'destroy', function(){
					this.$el.remove();
				});
				
				title.listenTo( title, 'keyup', function(){
					
				});
			});
			return this;
		}
	});

	InputWrap = wp.media.View.extend({
		template:  wp.template('grid-ui-input-wrap'),
		className: 'input-wrap',

		initialize: function( options ) {
			var inputs = getInputTypes();

			_.extend( options, {
				lock: features.locks
			} );
			wp.media.View.prototype.initialize.apply(this,arguments);
			if ( options.settings.type == 'html' ) {
				this.$el = $(options.settings.html);
				this.input = {
					getValue	: function(){},
					setValue	: function(){},
					render		: function(){},
					dismiss		: function(){}
				};
			} else if ( !! inputs[ options.settings.type ] ) {
				this.input = new inputs[ options.settings.type ]( options );
			} else {
				this.input = false;
				console.trace( 'no such input type', options.settings.type );
			}
		},
		render: function() {
			var self = this;
			wp.media.View.prototype.render.apply(this,arguments);
			
			if ( ! this.input ) {
				return this;
			}

			this.input.render();
			this.$('.input').append( this.input.$el );
			this.$el.addClass('input-type-'+this.options.settings.type );
			
			this.setLock( this.options.locked );
			
			if ( this.options.settings.attr ) {
				_.each( this.options.settings.attr, function( value, attr ) {
					var prevAttr = self.$el.attr( attr ),
						glue = ' ';
					if ( attr == 'style' ) {
						glue = ';';
					}
					self.$el.attr( attr, prevAttr + glue + value )
				} );
			}

			return this;
		},
		getLock: function() {
			return this.$('.lock [type="checkbox"]').prop('checked');
		},
		setLock: function( lock ) {
			this.$('.lock [type="checkbox"]').prop( 'checked', lock );
		},
		getValue: function() {
			return this.input.getValue();
		},
		setValue: function( value ) {
			this.input.setValue( value );
			return this;
		},
		dismiss: function() {
			this.input.dismiss();
			return this;
		}
	});

	InputGroup = wp.media.View.extend({
		template:  wp.template('grid-ui-input-group'),
		className: 'input-group',

		initialize: function( options ) {
			wp.media.View.prototype.initialize.apply( this, arguments );
			var self = this;
			this.model = options.model;

			this.inputs = [];
			_.each( options.settings.items, function( setting, name ) {

				if ( setting.type == 'matrix' ) {
					self.initializeInputMatrix( setting, name );
				} else {
					self.initializeInputWrap( setting, name );
				}
			});
		},
		initializeInputWrap: function( setting, name ){
			var value, input = false, self = this;
			_.extend( setting, { 
				name: name, 
				lock: features.locks && setting.type != 'label'
			});

			if ( features.locks || ! self.model.get( name+':locked' ) ) {
				value = self.model.get( name ),
				input = new InputWrap({
					controller	: self.controller,
					settings	: setting,
					value		: ( 'undefined' !== typeof value) ? value : null,
					locked		: !! self.model.get( name+':locked' ),
					model		: self.model
				});
				self.inputs.push( input );
			}
			return input;
		},
		initializeInputMatrix: function( setting, name ){
			var self = this,
				_matrix = new ParentView( {
					tagName		: 'table',
					className	: 'input-matrix form-table',
					template	: wp.template('grid-ui-input-matrix'),
				} );
			_.each( setting.rows, function( rowData, i ) {
				var _row = new ChildView( {
					tagName	: 'tr',
					parent	: _matrix
				} );
				_.each( rowData, function( cellData, name ) {
					var input, _cell = new ChildView( {
						tagName	: 'td',
						parent	: _row
					} );
					input = self.initializeInputWrap( cellData, name );
					input.$parent = _cell.$el;
				} );
			} );
			self.inputs.push( _matrix );
		},
		render: function() {	
			wp.media.View.prototype.render.apply(this,arguments);

			var self = this;
			_.each(this.inputs, function( input ){
				input.render();
				if ( input.$parent ) {
					input.$parent.append( input.$el );
				} else {
					self.$('.inputs').append( input.$el );
				}
			});

			return this;
		},
		dismiss: function() {
			_.each(this.inputs, function( input ){
				!!input.dismiss && input.dismiss();
			});
			return this;
		}
	});


	EditDialog = grid.view.EditDialog = grid.view.ui.Dialog.extend({
		template:  wp.template('grid-ui-edit-dialog'),
		className: 'edit-dialog sidebar',
		events: {
			'click .apply' : 'done'
		},
		initialize: function( options ) {
			var self = this;
			grid.view.ui.Dialog.prototype.initialize.apply(this,arguments);
		
			// setup input groups
			this.inputgroups = [];
			this.editor = new InputGroup({
				controller: this,
				model: this.model,
				settings: { title:'', items:options.editor.main }
			});

			_.each( options.editor.sidebar, function( setting, name ){
				_.extend( setting, { name: name });

				var inputgroup = new InputGroup({
					controller: self,
					model: self.model,
					settings: setting
				});
				self.inputgroups.push( inputgroup );
			});

			return this;
		},
		render: function() {
			grid.view.ui.Dialog.prototype.render.apply(this,arguments);

			var self = this;
			
			// render input fields
			_.each(this.inputgroups, function( inputgroup ){
				inputgroup.render();
				self.$('.grid-dialog-sidebar').append( inputgroup.$el );
			});
			
			this.$('.grid-dialog-content').append( this.editor.render().$el );
			
			return this;
		},
		applyChanges: function() {
			var self 		= this,
				updateModel	= {};
			function setModelVal( input ) {	
				if ( !! input.options.settings && !!input.options.settings.name ) {
					var prop = input.options.settings.name;
					if ( isNaN( parseInt(prop) ) ) {
						updateModel[ prop ] = input.getValue();
						if ( features.locks ) {
							updateModel[ prop + ':locked' ] = input.getLock();
						}
					}
				}
			}
			_.each( this.editor.inputs, setModelVal );

			_.each( this.inputgroups, function( group ) {
				_.each( group.inputs, setModelVal );
			});
			this.model.set( updateModel );
			return this;
		},
		done: function(){
			this.applyChanges();
			this.trigger( 'done' );
			return false;
		},
		dismiss: function() {
			this.editor.dismiss();

			_.each(this.inputgroups, function( inputgroup ) {
				inputgroup.dismiss();
			});
			grid.view.ui.Dialog.prototype.dismiss.apply( this, arguments );
			return this;
		}
	});

	ManageTemplatesDialog = grid.view.ManageTemplatesDialog = grid.view.ui.Dialog.extend({
		template:  wp.template('grid-ui-dialog'),
		className: 'manage-templates-dialog',
		events: {
			'click .apply':		'done',
		},
		initialize: function() {
			grid.view.ui.Dialog.prototype.initialize.apply(this,arguments);
			var self = this
				this.templateLists = {};

			_.each( [ 'Container', 'Row', 'Cell', 'Widget' ], function( type ) {

				self.templateLists[ type.toLowerCase() ] = new TemplatesList( { 
					title: l10n[ type ] + ' ' + l10n.Templates,
					templates: grid.templates[ type.toLowerCase() ]
				} );
			});
		},
		render: function() {
			grid.view.ui.Dialog.prototype.render.apply(this,arguments);

			var self = this;
			_.each( this.templateLists, function( templateList ){
				self.$('.grid-dialog-content').append( templateList.render().$el );
			});
			return this;
		},
		done: function(e){
			this.trigger( 'done' );
			return false;
		}
	});

	SelectWidgetDialog = grid.view.SelectWidgetDialog = grid.view.ui.Dialog.extend({
		template:  wp.template('grid-ui-dialog'),
		className: 'select-widget-dialog',
		events: {
			'change [name="widget_class"]' : 'done'
		},
		initialize: function( ) {
			var self = this;

			grid.view.ui.Dialog.prototype.initialize.apply(this,arguments);
			// should be buttons!
			this.selectWidget = new InputWrap( { 
				model: this.model,
				settings: {
					type:'radio',
					name: 'widget_class',
					title: l10n.WidgetTypes,
					options: options.widgets
				} 
			} );
			this.okayBtn.$el.hide();
		},
		render: function() {
			grid.view.ui.Dialog.prototype.render.apply(this,arguments);
			this.$('.grid-dialog-content').append( this.selectWidget.render().$el );
			return this;
		},
		done: function() {
			var val = this.selectWidget.getValue();
			this.model.set( 'widget_class', escape( val ) );
			this.selectWidget.setValue( null );
			this.trigger( 'done' );
			return false;
		}
	});

})(jQuery,window.grid);