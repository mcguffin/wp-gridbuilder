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
	- [ ] Export / Import Grid + Elements
	- [ ] Page Templates
	- [ ] Lock elements and properties --> allow Lock on specific roles
		- [ ] Model: each model & property has a lock property. like: 
				if ( ! model.get( 'locked') ) openEditorModalFor( model )
				if ( ! model.get( prop + ':locked') ) addEditorFor( prop, model )
		- [ ] UI: Admin view (edit everything including locks) + editor view (only edit unlocked models + properties)
	- [ ] Make compatible with ACF Widgets OR 
	- [ ] Maybe: Widget Base Class (with RTE)
	- [ ] Sophisticated widget previews
	- [ ] Undo (keep model state)	
	- [ ] Keyboard shortcuts: arrows, del, CMD+D
	- [ ] Widget: editable col-xx-n classes
 - [x] Bugs:
	- [x] FF: Grid guides not visible
 	- [x] FF: resize / shift does not work
	- [x] Add Cell > Add widget: row cells don't get resized
	- [x] Add Widget: row cells don't get resized
	- [x] Clone Widget -> Move to another cell: clones still exist (Not reproducable)
	- [x] Apply changes on prev/next
