(function( $, grid ){
	var GridObject, GridCollection,
		options = gridbuilder.options,
		l10n = gridbuilder.l10n,
		id = 0;
	
	GridObject = grid.model.GridObject = Backbone.Model.extend({
		parent:false,
		initialize: function( data ) {
			_.defaults( data, { items: [] } );
			var self = this;
			this.items = new GridCollection( [] );
			this.items.parent = this;
			this.parent = false;
			this.id = 'obj' + id++;

//			this.items.on( 'add', this.setItemParent, this );

			_.each( data.items, function( item, i ) {
				self.items.add(item);
			});
			delete(data.items);
			Backbone.Model.prototype.initialize.apply( this, arguments );
		},
		setItemParent: function(item) {
			item.parent = this;
		},
		toJSON: function(options) {
			var ret = Backbone.Model.prototype.toJSON.apply( this, arguments );
			ret.items = this.items.toJSON(options)
			return ret;
		}
	});
	GridCollection = grid.model.GridCollection = Backbone.Collection.extend({
		model:GridObject,
		comparator: function(model) {
			return model.get('idx');
		},
		add: function() {
			var models = Backbone.Collection.prototype.add.apply( this, arguments )
				self = this;
			modelsArr = models.constructor == Array ? models : [ models ];
			_.each( modelsArr, function( model, i ) {
				model.parent = self.parent;
			});
			return models;
		}
	});
	


	
	GridTemplate = grid.model.GridTemplate = Backbone.Model.extend({
		save: function( ) {
			var self = this;
			$.ajax({
				method: 'post',
				url: options.ajaxurl,
				complete:function(xhr,status){},
				success:function( data, status, xhr ) {
					_.each( data, function( value, prop ){ self.set( prop, value ) } );
					self.trigger('sync');
				},
				data: {
					action : this.isNew() ? 'gridbuilder-create-template' : 'gridbuilder-update-template',
					nonce  : this.isNew() ? options.create_template_nonce : options.update_template_nonce,
					template: JSON.stringify( this.toJSON() )
				},
			});
		},
		destroy: function( ) {
			var self = this;
			$.ajax({
				method: 'post',
				url: options.ajaxurl,
				complete:function(xhr,status){},
				success:function( data, status, xhr ) {
					self.trigger('destroy', self, self.collection );
				},
				data: {
					action : 'gridbuilder-delete-template',
					nonce  : options.delete_template_nonce,
					template: JSON.stringify( this.toJSON() )
				},
			});
		}
	});

	_.extend( grid.templates, {
		get: function( type, slug ) {
			type = type.toLowerCase();
			return grid.templates[type]._byId[ slug ];
		}
	});
	
	_.each( options.templates, function( templateList, type ) {
		grid.templates[type] = new Backbone.Collection();
		_.each( templateList, function( tpl, key ) {
			var template = new grid.model.GridTemplate( { 
				name: tpl.name,
				slug: tpl.slug,
				data: tpl.data,
				type: type
			} );
			template.set( 'id', tpl.slug );
			grid.templates[type].add( template );
		});
	});


})(jQuery, window.grid );