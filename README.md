WP GridBuilder
===============

A PageBuilder plugin for WordPress. Builds responsive pages for up to 4 device sizes.
Uses Twitter Bootstrap grid system.

This plugin is still pretty beta and works only in Chrome and Firefox.


ToDo:
-----
 - [x] Plugin Settings page
 - [ ] Enqueue bootstrap in frontend if option is on
 - [ ] Releasing
	- [x] JS Compression
	- [ ] PHP docblocks
	- [ ] JS docblocks
	- [ ] Plugin API Docs
	- [ ] l10n
 - [ ] Future
	- [x] Provide Out-of-the-box support for several RTE Widgets
	- [ ] Widget: editable col-xx-n classes
	- [ ] Export / Import Grid + Elements
	- [ ] Page Templates
	- [x] Lock elements and properties --> allow Lock on specific roles
		- [x] Lock properties
		- [x] Lock elements
			A locked element can not be editied, cloned or deleted
		- [x] Model: each model & property has a lock property. like: 
				if ( ! model.get( 'locked') ) openEditorModalFor( model )
				if ( ! model.get( prop + ':locked') ) addEditorFor( prop, model )
		- [x] UI
			- [x] Lock for each Property
			- [x] Add element Lock in toolbar
		- [x] Capabilities
		- [x] Locked Cell: prevent setting width + offset
		- [ ] Disable add-... btns depending on lock state
		- [ ] Default pointer on locked sort-handles
		- [ ] Lock page > style!
	- [ ] Make compatible with ACF Widgets 
	- [ ] Maybe: Widget Base Class (with RTE)
	- [ ] Sophisticated widget previews
	- [ ] Undo (keep model state)	
	- [ ] Keyboard shortcuts: arrows, del, CMD+D
	- [ ] dblclick = edit
 - [x] Bugs:
	- [x] FF: Grid guides not visible
 	- [x] FF: resize / shift does not work
	- [x] Add Cell > Add widget: row cells don't get resized
	- [x] Add Widget: row cells don't get resized
	- [x] Clone Widget -> Move to another cell: clones still exist (Not reproducable)
	- [x] Apply changes on prev/next
