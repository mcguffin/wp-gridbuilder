/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */


(function (factory) {
	"use strict";

	if (typeof define === "function" && define.amd) {
		define(factory);
	}
	else if (typeof module != "undefined" && typeof module.exports != "undefined") {
		module.exports = factory();
	}
	else if (typeof Package !== "undefined") {
		Sortable = factory();  // export for Meteor.js
	}
	else {
		/* jshint sub:true */
		window["Sortable"] = factory();
	}
})(function () {
	"use strict";
	
	if (typeof window == "undefined" || typeof window.document == "undefined") {
		return function() {
			throw new Error( "Sortable.js requires a window with a document" );
		}
	}

	var dragEl,
		parentEl,
		ghostEl,
		cloneEl,
		rootEl,
		nextEl,

		scrollEl,
		scrollParentEl,

		lastEl,
		lastCSS,
		lastParentCSS,

		oldIndex,
		newIndex,

		activeGroup,
		autoScroll = {},

		tapEvt,
		touchEvt,

		moved,

		/** @const */
		RSPACE = /\s+/g,

		expando = 'Sortable' + (new Date).getTime(),

		win = window,
		document = win.document,
		parseInt = win.parseInt,

		supportDraggable = !!('draggable' in document.createElement('div')),
		supportCssPointerEvents = (function (el) {
			el = document.createElement('x');
			el.style.cssText = 'pointer-events:auto';
			return el.style.pointerEvents === 'auto';
		})(),

		_silent = false,

		abs = Math.abs,
		slice = [].slice,

		touchDragOverListeners = [],

		_autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
			// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
			if (rootEl && options.scroll) {
				var el,
					rect,
					sens = options.scrollSensitivity,
					speed = options.scrollSpeed,

					x = evt.clientX,
					y = evt.clientY,

					winWidth = window.innerWidth,
					winHeight = window.innerHeight,

					vx,
					vy
				;

				// Delect scrollEl
				if (scrollParentEl !== rootEl) {
					scrollEl = options.scroll;
					scrollParentEl = rootEl;

					if (scrollEl === true) {
						scrollEl = rootEl;

						do {
							if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
								(scrollEl.offsetHeight < scrollEl.scrollHeight)
							) {
								break;
							}
							/* jshint boss:true */
						} while (scrollEl = scrollEl.parentNode);
					}
				}

				if (scrollEl) {
					el = scrollEl;
					rect = scrollEl.getBoundingClientRect();
					vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
					vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
				}


				if (!(vx || vy)) {
					vx = (winWidth - x <= sens) - (x <= sens);
					vy = (winHeight - y <= sens) - (y <= sens);

					/* jshint expr:true */
					(vx || vy) && (el = win);
				}


				if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
					autoScroll.el = el;
					autoScroll.vx = vx;
					autoScroll.vy = vy;

					clearInterval(autoScroll.pid);

					if (el) {
						autoScroll.pid = setInterval(function () {
							if (el === win) {
								win.scrollTo(win.pageXOffset + vx * speed, win.pageYOffset + vy * speed);
							} else {
								vy && (el.scrollTop += vy * speed);
								vx && (el.scrollLeft += vx * speed);
							}
						}, 24);
					}
				}
			}
		}, 30),

		_prepareGroup = function (options) {
			var group = options.group;

			if (!group || typeof group != 'object') {
				group = options.group = {name: group};
			}

			['pull', 'put'].forEach(function (key) {
				if (!(key in group)) {
					group[key] = true;
				}
			});

			options.groups = ' ' + group.name + (group.put.join ? ' ' + group.put.join(' ') : '') + ' ';
		}
	;



	/**
	 * @class  Sortable
	 * @param  {HTMLElement}  el
	 * @param  {Object}       [options]
	 */
	function Sortable(el, options) {
		if (!(el && el.nodeType && el.nodeType === 1)) {
			throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
		}

		this.el = el; // root element
		this.options = options = _extend({}, options);


		// Export instance
		el[expando] = this;


		// Default options
		var defaults = {
			group: Math.random(),
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			ignore: 'a, img',
			filter: null,
			animation: 0,
			setData: function (dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false,
			dataIdAttr: 'data-id',
			delay: 0,
			forceFallback: false,
			fallbackClass: 'sortable-fallback',
			fallbackOnBody: false
		};


		// Set default options
		for (var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}

		_prepareGroup(options);

		// Bind all private methods
		for (var fn in this) {
			if (fn.charAt(0) === '_') {
				this[fn] = this[fn].bind(this);
			}
		}

		// Setup drag mode
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;

		// Bind events
		_on(el, 'mousedown', this._onTapStart);
		_on(el, 'touchstart', this._onTapStart);

		if (this.nativeDraggable) {
			_on(el, 'dragover', this);
			_on(el, 'dragenter', this);
		}

		touchDragOverListeners.push(this._onDragOver);

		// Restore sorting
		options.store && this.sort(options.store.get(this));
	}


	Sortable.prototype = /** @lends Sortable.prototype */ {
		constructor: Sortable,

		_onTapStart: function (/** Event|TouchEvent */evt) {
			var _this = this,
				el = this.el,
				options = this.options,
				type = evt.type,
				touch = evt.touches && evt.touches[0],
				target = (touch || evt).target,
				originalTarget = target,
				filter = options.filter;


			if (type === 'mousedown' && evt.button !== 0 || options.disabled) {
				return; // only left button or enabled
			}

			target = _closest(target, options.draggable, el);

			if (!target) {
				return;
			}

			// get the index of the dragged element within its parent
			oldIndex = _index(target, options.draggable);

			// Check filter
			if (typeof filter === 'function') {
				if (filter.call(this, evt, target, this)) {
					_dispatchEvent(_this, originalTarget, 'filter', target, el, oldIndex);
					evt.preventDefault();
					return; // cancel dnd
				}
			}
			else if (filter) {
				filter = filter.split(',').some(function (criteria) {
					criteria = _closest(originalTarget, criteria.trim(), el);

					if (criteria) {
						_dispatchEvent(_this, criteria, 'filter', target, el, oldIndex);
						return true;
					}
				});

				if (filter) {
					evt.preventDefault();
					return; // cancel dnd
				}
			}


			if (options.handle && !_closest(originalTarget, options.handle, el)) {
				return;
			}


			// Prepare `dragstart`
			this._prepareDragStart(evt, touch, target);
		},

		_prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target) {
			var _this = this,
				el = _this.el,
				options = _this.options,
				ownerDocument = el.ownerDocument,
				dragStartFn;

			if (target && !dragEl && (target.parentNode === el)) {
				tapEvt = evt;

				rootEl = el;
				dragEl = target;
				parentEl = dragEl.parentNode;
				nextEl = dragEl.nextSibling;
				activeGroup = options.group;

				dragStartFn = function () {
					// Delayed drag has been triggered
					// we can re-enable the events: touchmove/mousemove
					_this._disableDelayedDrag();

					// Make the element draggable
					dragEl.draggable = true;

					// Chosen item
					_toggleClass(dragEl, _this.options.chosenClass, true);

					// Bind the events: dragstart/dragend
					_this._triggerDragStart(touch);
				};

				// Disable "draggable"
				options.ignore.split(',').forEach(function (criteria) {
					_find(dragEl, criteria.trim(), _disableDraggable);
				});

				_on(ownerDocument, 'mouseup', _this._onDrop);
				_on(ownerDocument, 'touchend', _this._onDrop);
				_on(ownerDocument, 'touchcancel', _this._onDrop);

				if (options.delay) {
					// If the user moves the pointer or let go the click or touch
					// before the delay has been reached:
					// disable the delayed drag
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
					_on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchmove', _this._disableDelayedDrag);

					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);
				} else {
					dragStartFn();
				}
			}
		},

		_disableDelayedDrag: function () {
			var ownerDocument = this.el.ownerDocument;

			clearTimeout(this._dragStartTimer);
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
			_off(ownerDocument, 'mousemove', this._disableDelayedDrag);
			_off(ownerDocument, 'touchmove', this._disableDelayedDrag);
		},

		_triggerDragStart: function (/** Touch */touch) {
			if (touch) {
				// Touch device support
				tapEvt = {
					target: dragEl,
					clientX: touch.clientX,
					clientY: touch.clientY
				};

				this._onDragStart(tapEvt, 'touch');
			}
			else if (!this.nativeDraggable) {
				this._onDragStart(tapEvt, true);
			}
			else {
				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);
			}

			try {
				if (document.selection) {
					document.selection.empty();
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch (err) {
			}
		},

		_dragStarted: function () {
			if (rootEl && dragEl) {
				// Apply effect
				_toggleClass(dragEl, this.options.ghostClass, true);

				Sortable.active = this;

				// Drag start event
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, oldIndex);
			}
		},

		_emulateDragOver: function () {
			if (touchEvt) {
				if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
					return;
				}

				this._lastX = touchEvt.clientX;
				this._lastY = touchEvt.clientY;

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', 'none');
				}

				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
					parent = target,
					groupName = ' ' + this.options.group.name + '',
					i = touchDragOverListeners.length;

				if (parent) {
					do {
						if (parent[expando] && parent[expando].options.groups.indexOf(groupName) > -1) {
							while (i--) {
								touchDragOverListeners[i]({
									clientX: touchEvt.clientX,
									clientY: touchEvt.clientY,
									target: target,
									rootEl: parent
								});
							}

							break;
						}

						target = parent; // store last element
					}
					/* jshint boss:true */
					while (parent = parent.parentNode);
				}

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', '');
				}
			}
		},


		_onTouchMove: function (/**TouchEvent*/evt) {
			if (tapEvt) {
				// only set the status to dragging, when we are actually dragging
				if (!Sortable.active) {
					this._dragStarted();
				}

				// as well as creating the ghost element on the document body
				this._appendGhost();

				var touch = evt.touches ? evt.touches[0] : evt,
					dx = touch.clientX - tapEvt.clientX,
					dy = touch.clientY - tapEvt.clientY,
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

				moved = true;
				touchEvt = touch;

				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);

				evt.preventDefault();
			}
		},

		_appendGhost: function () {
			if (!ghostEl) {
				var rect = dragEl.getBoundingClientRect(),
					css = _css(dragEl),
					options = this.options,
					ghostRect;

				ghostEl = dragEl.cloneNode(true);

				_toggleClass(ghostEl, options.ghostClass, false);
				_toggleClass(ghostEl, options.fallbackClass, true);

				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', 'fixed');
				_css(ghostEl, 'zIndex', '100000');
				_css(ghostEl, 'pointerEvents', 'none');

				options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

				// Fixing dimensions.
				ghostRect = ghostEl.getBoundingClientRect();
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
			}
		},

		_onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {
			var dataTransfer = evt.dataTransfer,
				options = this.options;

			this._offUpEvents();

			if (activeGroup.pull == 'clone') {
				cloneEl = dragEl.cloneNode(true);
				_css(cloneEl, 'display', 'none');
				rootEl.insertBefore(cloneEl, dragEl);
			}

			if (useFallback) {

				if (useFallback === 'touch') {
					// Bind touch events
					_on(document, 'touchmove', this._onTouchMove);
					_on(document, 'touchend', this._onDrop);
					_on(document, 'touchcancel', this._onDrop);
				} else {
					// Old brwoser
					_on(document, 'mousemove', this._onTouchMove);
					_on(document, 'mouseup', this._onDrop);
				}

				this._loopId = setInterval(this._emulateDragOver, 50);
			}
			else {
				if (dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(this, dataTransfer, dragEl);
				}

				_on(document, 'drop', this);
				setTimeout(this._dragStarted, 0);
			}
		},

		_onDragOver: function (/**Event*/evt) {
			var el = this.el,
				target,
				dragRect,
				revert,
				options = this.options,
				group = options.group,
				groupPut = group.put,
				isOwner = (activeGroup === group),
				canSort = options.sort;

			if (evt.preventDefault !== void 0) {
				evt.preventDefault();
				!options.dragoverBubble && evt.stopPropagation();
			}

			moved = true;

			if (activeGroup && !options.disabled &&
				(isOwner
					? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
					: activeGroup.pull && groupPut && (
						(activeGroup.name === group.name) || // by Name
						(groupPut.indexOf && ~groupPut.indexOf(activeGroup.name)) // by Array
					)
				) &&
				(evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
			) {
				// Smart auto-scrolling
				_autoScroll(evt, options, this.el);

				if (_silent) {
					return;
				}

				target = _closest(evt.target, options.draggable, el);
				dragRect = dragEl.getBoundingClientRect();

				if (revert) {
					_cloneHide(true);

					if (cloneEl || nextEl) {
						rootEl.insertBefore(dragEl, cloneEl || nextEl);
					}
					else if (!canSort) {
						rootEl.appendChild(dragEl);
					}

					return;
				}


				if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
					(el === evt.target) && (target = _ghostIsLast(el, evt))
				) {

					if (target) {
						if (target.animated) {
							return;
						}

						targetRect = target.getBoundingClientRect();
					}

					_cloneHide(isOwner);

					if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect) !== false) {
						if (!dragEl.contains(el)) {
							el.appendChild(dragEl);
							parentEl = el; // actualization
						}

						this._animate(dragRect, dragEl);
						target && this._animate(targetRect, target);
					}
				}
				else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
					if (lastEl !== target) {
						lastEl = target;
						lastCSS = _css(target);
						lastParentCSS = _css(target.parentNode);
					}


					var targetRect = target.getBoundingClientRect(),
						width = targetRect.right - targetRect.left,
						height = targetRect.bottom - targetRect.top,
						floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display)
							|| (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
						isWide = (target.offsetWidth > dragEl.offsetWidth),
						isLong = (target.offsetHeight > dragEl.offsetHeight),
						halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
						nextSibling = target.nextElementSibling,
						moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect),
						after
					;

					if (moveVector !== false) {
						_silent = true;
						setTimeout(_unsilent, 30);

						_cloneHide(isOwner);

						if (moveVector === 1 || moveVector === -1) {
							after = (moveVector === 1);
						}
						else if (floating) {
							var elTop = dragEl.offsetTop,
								tgTop = target.offsetTop;

							if (elTop === tgTop) {
								after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
							} else {
								after = tgTop > elTop;
							}
						} else {
							after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
						}

						if (!dragEl.contains(el)) {
							if (after && !nextSibling) {
								el.appendChild(dragEl);
							} else {
								target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
							}
						}

						parentEl = dragEl.parentNode; // actualization

						this._animate(dragRect, dragEl);
						this._animate(targetRect, target);
					}
				}
			}
		},

		_animate: function (prevRect, target) {
			var ms = this.options.animation;

			if (ms) {
				var currentRect = target.getBoundingClientRect();

				_css(target, 'transition', 'none');
				_css(target, 'transform', 'translate3d('
					+ (prevRect.left - currentRect.left) + 'px,'
					+ (prevRect.top - currentRect.top) + 'px,0)'
				);

				target.offsetWidth; // repaint

				_css(target, 'transition', 'all ' + ms + 'ms');
				_css(target, 'transform', 'translate3d(0,0,0)');

				clearTimeout(target.animated);
				target.animated = setTimeout(function () {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},

		_offUpEvents: function () {
			var ownerDocument = this.el.ownerDocument;

			_off(document, 'touchmove', this._onTouchMove);
			_off(ownerDocument, 'mouseup', this._onDrop);
			_off(ownerDocument, 'touchend', this._onDrop);
			_off(ownerDocument, 'touchcancel', this._onDrop);
		},

		_onDrop: function (/**Event*/evt) {
			var el = this.el,
				options = this.options;

			clearInterval(this._loopId);
			clearInterval(autoScroll.pid);
			clearTimeout(this._dragStartTimer);

			// Unbind events
			_off(document, 'mousemove', this._onTouchMove);

			if (this.nativeDraggable) {
				_off(document, 'drop', this);
				_off(el, 'dragstart', this._onDragStart);
			}

			this._offUpEvents();

			if (evt) {
				if (moved) {
					evt.preventDefault();
					!options.dropBubble && evt.stopPropagation();
				}

				ghostEl && ghostEl.parentNode.removeChild(ghostEl);

				if (dragEl) {
					if (this.nativeDraggable) {
						_off(dragEl, 'dragend', this);
					}

					_disableDraggable(dragEl);

					// Remove class's
					_toggleClass(dragEl, this.options.ghostClass, false);
					_toggleClass(dragEl, this.options.chosenClass, false);

					if (rootEl !== parentEl) {
						newIndex = _index(dragEl, options.draggable);

						if (newIndex >= 0) {
							// drag from one list and drop into another
							_dispatchEvent(null, parentEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
							_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);

							// Add event
							_dispatchEvent(null, parentEl, 'add', dragEl, rootEl, oldIndex, newIndex);

							// Remove event
							_dispatchEvent(this, rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);
						}
					}
					else {
						// Remove clone
						cloneEl && cloneEl.parentNode.removeChild(cloneEl);

						if (dragEl.nextSibling !== nextEl) {
							// Get the index of the dragged element within its parent
							newIndex = _index(dragEl, options.draggable);

							if (newIndex >= 0) {
								// drag & drop within the same list
								_dispatchEvent(this, rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);
								_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
							}
						}
					}

					if (Sortable.active) {
						if (newIndex === null || newIndex === -1) {
							newIndex = oldIndex;
						}

						_dispatchEvent(this, rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);

						// Save sorting
						this.save();
					}
				}

			}
			this._nulling();
		},

		_nulling: function() {
			// Nulling
			rootEl =
			dragEl =
			parentEl =
			ghostEl =
			nextEl =
			cloneEl =

			scrollEl =
			scrollParentEl =

			tapEvt =
			touchEvt =

			moved =
			newIndex =

			lastEl =
			lastCSS =

			activeGroup =
			Sortable.active = null;
		},

		handleEvent: function (/**Event*/evt) {
			var type = evt.type;

			if (type === 'dragover' || type === 'dragenter') {
				if (dragEl) {
					this._onDragOver(evt);
					_globalDragOver(evt);
				}
			}
			else if (type === 'drop' || type === 'dragend') {
				this._onDrop(evt);
			}
		},


		/**
		 * Serializes the item into an array of string.
		 * @returns {String[]}
		 */
		toArray: function () {
			var order = [],
				el,
				children = this.el.children,
				i = 0,
				n = children.length,
				options = this.options;

			for (; i < n; i++) {
				el = children[i];
				if (_closest(el, options.draggable, this.el)) {
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
				}
			}

			return order;
		},


		/**
		 * Sorts the elements according to the array.
		 * @param  {String[]}  order  order of the items
		 */
		sort: function (order) {
			var items = {}, rootEl = this.el;

			this.toArray().forEach(function (id, i) {
				var el = rootEl.children[i];

				if (_closest(el, this.options.draggable, rootEl)) {
					items[id] = el;
				}
			}, this);

			order.forEach(function (id) {
				if (items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},


		/**
		 * Save the current sorting
		 */
		save: function () {
			var store = this.options.store;
			store && store.set(this);
		},


		/**
		 * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
		 * @param   {HTMLElement}  el
		 * @param   {String}       [selector]  default: `options.draggable`
		 * @returns {HTMLElement|null}
		 */
		closest: function (el, selector) {
			return _closest(el, selector || this.options.draggable, this.el);
		},


		/**
		 * Set/get option
		 * @param   {string} name
		 * @param   {*}      [value]
		 * @returns {*}
		 */
		option: function (name, value) {
			var options = this.options;

			if (value === void 0) {
				return options[name];
			} else {
				options[name] = value;

				if (name === 'group') {
					_prepareGroup(options);
				}
			}
		},


		/**
		 * Destroy
		 */
		destroy: function () {
			var el = this.el;

			el[expando] = null;

			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);

			if (this.nativeDraggable) {
				_off(el, 'dragover', this);
				_off(el, 'dragenter', this);
			}

			// Remove draggable attributes
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
				el.removeAttribute('draggable');
			});

			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

			this._onDrop();

			this.el = el = null;
		}
	};


	function _cloneHide(state) {
		if (cloneEl && (cloneEl.state !== state)) {
			_css(cloneEl, 'display', state ? 'none' : '');
			!state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
			cloneEl.state = state;
		}
	}


	function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
		if (el) {
			ctx = ctx || document;

			do {
				if (
					(selector === '>*' && el.parentNode === ctx)
					|| _matches(el, selector)
				) {
					return el;
				}
			}
			while (el !== ctx && (el = el.parentNode));
		}

		return null;
	}


	function _globalDragOver(/**Event*/evt) {
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = 'move';
		}
		evt.preventDefault();
	}


	function _on(el, event, fn) {
		el.addEventListener(event, fn, false);
	}


	function _off(el, event, fn) {
		el.removeEventListener(event, fn, false);
	}


	function _toggleClass(el, name, state) {
		if (el) {
			if (el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			}
			else {
				var className = (' ' + el.className + ' ').replace(RSPACE, ' ').replace(' ' + name + ' ', ' ');
				el.className = (className + (state ? ' ' + name : '')).replace(RSPACE, ' ');
			}
		}
	}


	function _css(el, prop, val) {
		var style = el && el.style;

		if (style) {
			if (val === void 0) {
				if (document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				}
				else if (el.currentStyle) {
					val = el.currentStyle;
				}

				return prop === void 0 ? val : val[prop];
			}
			else {
				if (!(prop in style)) {
					prop = '-webkit-' + prop;
				}

				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}


	function _find(ctx, tagName, iterator) {
		if (ctx) {
			var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

			if (iterator) {
				for (; i < n; i++) {
					iterator(list[i], i);
				}
			}

			return list;
		}

		return [];
	}



	function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {
		var evt = document.createEvent('Event'),
			options = (sortable || rootEl[expando]).options,
			onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

		evt.initEvent(name, true, true);

		evt.to = rootEl;
		evt.from = fromEl || rootEl;
		evt.item = targetEl || rootEl;
		evt.clone = cloneEl;

		evt.oldIndex = startIndex;
		evt.newIndex = newIndex;

		rootEl.dispatchEvent(evt);

		if (options[onName]) {
			options[onName].call(sortable, evt);
		}
	}


	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect) {
		var evt,
			sortable = fromEl[expando],
			onMoveFn = sortable.options.onMove,
			retVal;

		evt = document.createEvent('Event');
		evt.initEvent('move', true, true);

		evt.to = toEl;
		evt.from = fromEl;
		evt.dragged = dragEl;
		evt.draggedRect = dragRect;
		evt.related = targetEl || toEl;
		evt.relatedRect = targetRect || toEl.getBoundingClientRect();

		fromEl.dispatchEvent(evt);

		if (onMoveFn) {
			retVal = onMoveFn.call(sortable, evt);
		}

		return retVal;
	}


	function _disableDraggable(el) {
		el.draggable = false;
	}


	function _unsilent() {
		_silent = false;
	}


	/** @returns {HTMLElement|false} */
	function _ghostIsLast(el, evt) {
		var lastEl = el.lastElementChild,
				rect = lastEl.getBoundingClientRect();

		return ((evt.clientY - (rect.top + rect.height) > 5) || (evt.clientX - (rect.right + rect.width) > 5)) && lastEl; // min delta
	}


	/**
	 * Generate id
	 * @param   {HTMLElement} el
	 * @returns {String}
	 * @private
	 */
	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
			i = str.length,
			sum = 0;

		while (i--) {
			sum += str.charCodeAt(i);
		}

		return sum.toString(36);
	}

	/**
	 * Returns the index of an element within its parent for a selected set of
	 * elements
	 * @param  {HTMLElement} el
	 * @param  {selector} selector
	 * @return {number}
	 */
	function _index(el, selector) {
		var index = 0;

		if (!el || !el.parentNode) {
			return -1;
		}

		while (el && (el = el.previousElementSibling)) {
			if (el.nodeName.toUpperCase() !== 'TEMPLATE'
					&& _matches(el, selector)) {
				index++;
			}
		}

		return index;
	}

	function _matches(/**HTMLElement*/el, /**String*/selector) {
		if (el) {
			selector = selector.split('.');

			var tag = selector.shift().toUpperCase(),
				re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');

			return (
				(tag === '' || el.nodeName.toUpperCase() == tag) &&
				(!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)
			);
		}

		return false;
	}

	function _throttle(callback, ms) {
		var args, _this;

		return function () {
			if (args === void 0) {
				args = arguments;
				_this = this;

				setTimeout(function () {
					if (args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}

					args = void 0;
				}, ms);
			}
		};
	}

	function _extend(dst, src) {
		if (dst && src) {
			for (var key in src) {
				if (src.hasOwnProperty(key)) {
					dst[key] = src[key];
				}
			}
		}

		return dst;
	}


	// Export utils
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		is: function (el, selector) {
			return !!_closest(el, selector, el);
		},
		extend: _extend,
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		index: _index
	};


	/**
	 * Create sortable instance
	 * @param {HTMLElement}  el
	 * @param {Object}      [options]
	 */
	Sortable.create = function (el, options) {
		return new Sortable(el, options);
	};


	// Export
	Sortable.version = '1.4.2';
	return Sortable;
});

/**
 * jQuery plugin for Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */
(function (factory) {
	"use strict";

	if (typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	}
	else {
		/* jshint sub:true */
		factory(jQuery);
	}
})(function ($) {
	"use strict";


	/* CODE */


	/**
	 * jQuery plugin for Sortable
	 * @param   {Object|String} options
	 * @param   {..*}           [args]
	 * @returns {jQuery|*}
	 */
	$.fn.sortable = function (options) {
		var retVal,
			args = arguments;

		this.each(function () {
			var $el = $(this),
				sortable = $el.data('sortable');

			if (!sortable && (options instanceof Object || !options)) {
				sortable = new Sortable(this, options);
				$el.data('sortable', sortable);
			}

			if (sortable) {
				if (options === 'widget') {
					return sortable;
				}
				else if (options === 'destroy') {
					sortable.destroy();
					$el.removeData('sortable');
				}
				else if (typeof sortable[options] === 'function') {
					retVal = sortable[options].apply(sortable, [].slice.call(args, 1));
				}
				else if (options in sortable.options) {
					retVal = sortable.option.apply(sortable, args);
				}
			}
		});

		return (retVal === void 0) ? this : retVal;
	};
});

(function($,exports){
	String.prototype.removeAccents = function() {

		var removalMap = {
			'A'  : /[AⒶＡÀÁÂẦẤẪẨÃĀĂẰẮẴẲȦǠÄǞẢÅǺǍȀȂẠẬẶḀĄ]/g,
			'AA' : /[Ꜳ]/g,
			'AE' : /[ÆǼǢ]/g,
			'AO' : /[Ꜵ]/g,
			'AU' : /[Ꜷ]/g,
			'AV' : /[ꜸꜺ]/g,
			'AY' : /[Ꜽ]/g,
			'B'  : /[BⒷＢḂḄḆɃƂƁ]/g,
			'C'  : /[CⒸＣĆĈĊČÇḈƇȻꜾ]/g,
			'D'  : /[DⒹＤḊĎḌḐḒḎĐƋƊƉꝹ]/g,
			'DZ' : /[ǱǄ]/g,
			'Dz' : /[ǲǅ]/g,
			'E'  : /[EⒺＥÈÉÊỀẾỄỂẼĒḔḖĔĖËẺĚȄȆẸỆȨḜĘḘḚƐƎ]/g,
			'F'  : /[FⒻＦḞƑꝻ]/g,
			'G'  : /[GⒼＧǴĜḠĞĠǦĢǤƓꞠꝽꝾ]/g,
			'H'  : /[HⒽＨĤḢḦȞḤḨḪĦⱧⱵꞍ]/g,
			'I'  : /[IⒾＩÌÍÎĨĪĬİÏḮỈǏȈȊỊĮḬƗ]/g,
			'J'  : /[JⒿＪĴɈ]/g,
			'K'  : /[KⓀＫḰǨḲĶḴƘⱩꝀꝂꝄꞢ]/g,
			'L'  : /[LⓁＬĿĹĽḶḸĻḼḺŁȽⱢⱠꝈꝆꞀ]/g,
			'LJ' : /[Ǉ]/g,
			'Lj' : /[ǈ]/g,
			'M'  : /[MⓂＭḾṀṂⱮƜ]/g,
			'N'  : /[NⓃＮǸŃÑṄŇṆŅṊṈȠƝꞐꞤ]/g,
			'NJ' : /[Ǌ]/g,
			'Nj' : /[ǋ]/g,
			'O'  : /[OⓄＯÒÓÔỒỐỖỔÕṌȬṎŌṐṒŎȮȰÖȪỎŐǑȌȎƠỜỚỠỞỢỌỘǪǬØǾƆƟꝊꝌ]/g,
			'OI' : /[Ƣ]/g,
			'OO' : /[Ꝏ]/g,
			'OU' : /[Ȣ]/g,
			'P'  : /[PⓅＰṔṖƤⱣꝐꝒꝔ]/g,
			'Q'  : /[QⓆＱꝖꝘɊ]/g,
			'R'  : /[RⓇＲŔṘŘȐȒṚṜŖṞɌⱤꝚꞦꞂ]/g,
			'S'  : /[SⓈＳẞŚṤŜṠŠṦṢṨȘŞⱾꞨꞄ]/g,
			'T'  : /[TⓉＴṪŤṬȚŢṰṮŦƬƮȾꞆ]/g,
			'TZ' : /[Ꜩ]/g,
			'U'  : /[UⓊＵÙÚÛŨṸŪṺŬÜǛǗǕǙỦŮŰǓȔȖƯỪỨỮỬỰỤṲŲṶṴɄ]/g,
			'V'  : /[VⓋＶṼṾƲꝞɅ]/g,
			'VY' : /[Ꝡ]/g,
			'W'  : /[WⓌＷẀẂŴẆẄẈⱲ]/g,
			'X'  : /[XⓍＸẊẌ]/g,
			'Y'  : /[YⓎＹỲÝŶỸȲẎŸỶỴƳɎỾ]/g,
			'Z'  : /[ZⓏＺŹẐŻŽẒẔƵȤⱿⱫꝢ]/g,
			'a'  : /[aⓐａẚàáâầấẫẩãāăằắẵẳȧǡäǟảåǻǎȁȃạậặḁąⱥɐ]/g,
			'aa' : /[ꜳ]/g,
			'ae' : /[æǽǣ]/g,
			'ao' : /[ꜵ]/g,
			'au' : /[ꜷ]/g,
			'av' : /[ꜹꜻ]/g,
			'ay' : /[ꜽ]/g,
			'b'  : /[bⓑｂḃḅḇƀƃɓ]/g,
			'c'  : /[cⓒｃćĉċčçḉƈȼꜿↄ]/g,
			'd'  : /[dⓓｄḋďḍḑḓḏđƌɖɗꝺ]/g,
			'dz' : /[ǳǆ]/g,
			'e'  : /[eⓔｅèéêềếễểẽēḕḗĕėëẻěȅȇẹệȩḝęḙḛɇɛǝ]/g,
			'f'  : /[fⓕｆḟƒꝼ]/g,
			'g'  : /[gⓖｇǵĝḡğġǧģǥɠꞡᵹꝿ]/g,
			'h'  : /[hⓗｈĥḣḧȟḥḩḫẖħⱨⱶɥ]/g,
			'hv' : /[ƕ]/g,
			'i'  : /[iⓘｉìíîĩīĭïḯỉǐȉȋịįḭɨı]/g,
			'j'  : /[jⓙｊĵǰɉ]/g,
			'k'  : /[kⓚｋḱǩḳķḵƙⱪꝁꝃꝅꞣ]/g,
			'l'  : /[lⓛｌŀĺľḷḹļḽḻſłƚɫⱡꝉꞁꝇ]/g,
			'lj' : /[ǉ]/g,
			'm'  : /[mⓜｍḿṁṃɱɯ]/g,
			'n'  : /[nⓝｎǹńñṅňṇņṋṉƞɲŉꞑꞥ]/g,
			'nj' : /[ǌ]/g,
			'o'  : /[oⓞｏòóôồốỗổõṍȭṏōṑṓŏȯȱöȫỏőǒȍȏơờớỡởợọộǫǭøǿɔꝋꝍɵ]/g,
			'oi' : /[ƣ]/g,
			'ou' : /[ȣ]/g,
			'oo' : /[ꝏ]/g,
			'p'  : /[pⓟｐṕṗƥᵽꝑꝓꝕ]/g,
			'q'  : /[qⓠｑɋꝗꝙ]/g,
			'r'  : /[rⓡｒŕṙřȑȓṛṝŗṟɍɽꝛꞧꞃ]/g,
			's'  : /[sⓢｓßśṥŝṡšṧṣṩșşȿꞩꞅẛ]/g,
			't'  : /[tⓣｔṫẗťṭțţṱṯŧƭʈⱦꞇ]/g,
			'tz' : /[ꜩ]/g,
			'u'  : /[uⓤｕùúûũṹūṻŭüǜǘǖǚủůűǔȕȗưừứữửựụṳųṷṵʉ]/g,
			'v'  : /[vⓥｖṽṿʋꝟʌ]/g,
			'vy' : /[ꝡ]/g,
			'w'  : /[wⓦｗẁẃŵẇẅẘẉⱳ]/g,
			'x'  : /[xⓧｘẋẍ]/g,
			'y'  : /[yⓨｙỳýŷỹȳẏÿỷẙỵƴɏỿ]/g,
			'z'  : /[zⓩｚźẑżžẓẕƶȥɀⱬꝣ]/g,
		};

		var str = this;

		for(var latin in removalMap) {
		  var nonLatin = removalMap[latin];
		  str = str.replace(nonLatin , latin);
		}

		return str;
	}

	var options		= gridbuilder.options,
		l10n		= gridbuilder.l10n,
		grid		= exports.grid = {};


	exports.grid.model		= {};
	exports.grid.view		= {
		ui		: {},
		element	: {}
	};
	exports.grid.controller	= {};
	exports.grid.templates	= {};
	exports.grid.utils		= {
		sanitizeTitle: function( str ){
			str = str.removeAccents().toLowerCase();
			str = str.replace(/[^a-z0-9]/g,'-');
			str = str.replace(/-+/g,'-');
			str = str.replace(/-+$/g,'');
			return str;
		},
	}


	exports.grid.controller.Grid = function( ) {
		this.$input	= $('[name="_grid_data"]');
		this.postID	= $('[name="post_ID"]').val();
		var self	= this,
			raw		= this.$input.attr('value')
			data	= JSON.parse( raw );// || [];
		
		this.model		= new grid.model.GridObject( data );
		this.subviews	= new Backbone.Collection([]);
		this.selected	= false;

		this.listenTo( this.model, 'change', this.onChangeModel );

		this.view = new exports.grid.view.ui.Editor( {
			controller: this,
			model: this.model
		} );
		this.view.setActiveEditor();
		this.view.$el.insertAfter( '#wp-content-wrap' );
		this.view.render();
		this.view.$el.focus();

		$(document).on( 'click', '[type="submit"]', function( e ) {
			self.onChangeModel();
		});

	};

	_.extend( exports.grid.controller.Grid.prototype, {
		whichView:	function() {
			return this.view.whichView();
		},
		getSelected:	function( what ) {
			return this.selected;
		},
		setSelected:	function( what ) {
//			console.log(this.selected.$el);
			this.selected = what;
			return this;
		},
		onChangeModel:	function() {
			var val = JSON.stringify( this.model.toJSON() );
			// push to undo!
			this.$input.val( val );
		},
		autosave: 		function() {
			$.ajax({
				method: 	'post',
				url: 		options.ajaxurl,
				complete:	function(xhr,status){ },
				success: 	function( data, status, xhr ) {
					if ( data.success ) {
						// Yeah!
					} else {
						// show message
					}
				},
				data: {
					action:		'gridbuilder-autosave',
					nonce:		options.autosave_nonce,
					grid_data:	JSON.stringify( this.model.toJSON() ),
					post_id:	this.postID
				},
			});
		
		}
	}, Backbone.Events);

	_.extend( exports.grid.controller.Grid, Backbone.Events);

})(jQuery,window);
(function( $, grid ){
	var GridObject, GridCollection,
		options	= gridbuilder.options,
		l10n	= gridbuilder.l10n,
		id		= 0;
	
	GridObject = grid.model.GridObject = Backbone.Model.extend({
		parent:false,
		locks:{},
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
			var models = Backbone.Collection.prototype.add.apply( this, arguments ),
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
				method: 	'post',
				url: 		options.ajaxurl,
				complete:	function(xhr,status){},
				success:	function( data, status, xhr ) {
					_.each( data, function( value, prop ){ self.set( prop, value ) } );
					self.trigger('sync');
				},
				data:	{
					action : this.isNew() ? 'gridbuilder-create-template' : 'gridbuilder-update-template',
					nonce  : this.isNew() ? options.create_template_nonce : options.update_template_nonce,
					template: JSON.stringify( this.toJSON() )
				},
			});
		},
		destroy: function( ) {
			var self = this;
			$.ajax({
				method: 	'post',
				url: 		options.ajaxurl,
				complete:	function(xhr,status){},
				success:	function( data, status, xhr ) {
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
(function( $, grid ) {

	var Prompt, Dialog, Modal, Toolbar,
		
		l10n		= gridbuilder.l10n,
		options		= gridbuilder.options,
		features	= gridbuilder.options.features;

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

			if ( !!current && ! current.is( grid.view.element.Grid ) ) {
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
				var can_edit, prop,
					viewSize	= this.toolbar.whichView(),
					sel			= this.getSelected();

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
					case 39: // arrow-right
					case 38: // arrow-up
					case 40: // arrow-down
						prop		= e.shiftKey ? 'size' : 'offset';
						can_edit	= features.locks || ( ! sel.model.get( 'locked' ) && ! sel.model.get( prop + '_' + viewSize + ':locked' ) );

						if ( can_edit && sel.is( grid.view.element.Cell ) ) {
							if ( e.keyCode == 37 ) { // left
								e.shiftKey ? sel.decrementSize() : sel.decrementOffset();
							} else if ( e.keyCode == 39 ) { // right
								e.shiftKey ? sel.incrementSize() : sel.incrementOffset();
							}
						}

						e.stopPropagation();
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
			this.$el.append( this.toolbar.$el );
			this.$el.append( this.grid.$el );
			this.grid.render();
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
				val = template ? template.get('data') : { size_xs: options.screensizes.columns };

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
					controller:	this,
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

			if ( _.isUndefined( prev ) && ! current.parent().is( grid.view.element.Grid ) ) {
				prev = current.parent();
			} else if (! _.isUndefined( prev ) && ! prev.is( grid.view.element.Widget ) ) {
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
				while ( _.isUndefined( next ) && ! current.is( grid.view.element.Grid ) ) {
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
				//settings	= options.settings[ current.getClassName().toLowerCase() ],
				editor		= options.editors[ current.getClassName().toLowerCase() ],
				dialog, title = [], currentTitle = current, titleSegment;
//			title = [];

			while ( !! currentTitle && ! currentTitle.is( grid.view.element.Grid ) ) {
				titleSegment = currentTitle.getTitle(); 
				title.unshift( titleSegment );
				currentTitle = currentTitle.parent();
			}
//			console.log(currentTitle.is);return;
			dialog		= new grid.view.EditDialog( { 
				title: title.join( ' › ' ),
				controller: this , 
				model: current.model, 
				item: current,
			//	settings: settings, 
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

					self.toolbar.update();

					self.toolbar.setupTemplateSelects();

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

})( jQuery, window.grid );
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
		tagName: 'form',
		className: 'widget-instance',
		
		initialize: function( ) {
			wp.media.View.prototype.initialize.apply(this,arguments);
			this.$el.append( '<span class="spinner" style="visibility:visible;float:none"></span>' );
			this.$widget	= null;

			var self		= this;


			$.ajax({
				method: 'post',
				url: options.ajaxurl,
				complete:function(xhr,status){},
				success: function( data, status, xhr ) {
					self.$widget = $(data);
					self.$el.html('').append( self.$widget );
					self.prepareMCE();
					$(document).trigger( 'widget-added', [ self.$widget ] ); // necessary for tinymce widget
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

			_.each( this.$el.serializeArray(), function( val ) {
				var name, matches = val.name.match( /\[([a-z0-9-_]+)\]$/g );
				name = matches.length ? matches[0].replace(/[\[\]]+/g,'') : val.name;
				ret[ name ] = val.value;
			});
			return ret;
		},
		setValue: function( value ) {
			return this;
		},
		dismiss: function() {
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
			this._prevMCE.wpLinkRenderHtml = tinymce.ui.WPLinkPreview.prototype.renderHtml;
			tinymce.ui.WPLinkPreview.prototype.renderHtml = function() {
				var ret = self._prevMCE.wpLinkRenderHtml.apply(this,arguments);
				return ret.replace('class="wp-link-preview"','class="wp-link-preview in-grid-modal"');
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
				console.log( 'no such type', options.settings.type );
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
(function( $, grid ){
	
	if ( !! document.caretPositionFromPoint && ! document.caretRangeFromPoint ) {
		document.caretRangeFromPoint = document.caretPositionFromPoint;
	}
	
	var Grid, Container, Row, Cell, Widget,
		CollectionView, 
		ColumnCollectionView,
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
			'dblclick'	: 'edit'
		},
		initialize: function( options ) {
			var self = this, template;
			
			this.Subviews	= wp.Backbone.Subviews;
			this.options	= options;
			this.controller	= options.controller;
			this.model 		= options.model;
			this.templateDisplay = new TemplateDisplay({ model: this.model });
			this.selectorDisplay = new SelectorDisplay({ model: this.model });

			this.listenTo( this.model, 'change', this.updateDisplay );

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
				$collection = this.$('>.collection,>*>.collection').first();

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

			this.updateDisplay();

			return this;
		},
		reFocus: function( ){
			this.$el.focus();
		},
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

	ColumnCollectionView = CollectionView.extend({
		initialize: function() {
			var ret = CollectionView.prototype.initialize.apply(this,arguments);
			return ret;
		},
		updateDisplay: function() {
			CollectionView.prototype.updateDisplay.apply( this, arguments );
			this.updateColLockClasses();
			this.updateSizeClasses();
			this.updateOffsetClasses();
		},
		render: function() {
			var self = this;
			CollectionView.prototype.render.apply(this,arguments);
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

			return size || options.screensizes.columns ;
		},

		hasColClass: function() {

			var classname,
				viewSize	= '(\\w+)',
				size		= '(\\d+)';

			if ( arguments[0] ) {
				viewSize = arguments[0];
				if ( arguments[1] ) {
					size = arguments[1];
				}
			}

			classname = options.screensizes.size_class_template({ screensize: viewSize, size: size });

			return !! this.$el.attr('class').match( new RegExp(classname,'g') );
			
		},
		setColClass: function( size, viewSize ) {
			var className;
			this.$el.removeClass( this.getColClassnames( viewSize ).join(' ') );
			if ( ! isNaN( parseInt(size) ) ) {
				className = options.screensizes.size_class_template({ screensize: viewSize, size: size });
				this.$el.addClass( className );
			}
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
			var className;
			this.$el.removeClass( this.getColClassnames( viewSize, options.screensizes.offset_class_template ).join(' ') );
			if ( ! isNaN( parseInt( offset ) ) ) {
				className = options.screensizes.offset_class_template({ screensize: viewSize, size: offset });
				this.$el.addClass( className );
			}
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
		updateSizeClasses: function() {
			var self = this;
			_.each( options.screensizes.sizes, function( siteOptions, screenSize ) {
				var size = self.model.get( 'size_' + screenSize );
				self.setColClass( size, screenSize );
			});
		},
		updateOffsetClasses: function() {
			var self = this;
			_.each( options.screensizes.sizes, function( siteOptions, screenSize ) {
				var offset = self.model.get( 'offset_' + screenSize );
				self.setOffsetClass( offset, screenSize );
			});
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
	});

	Widget = grid.view.element.Widget = ColumnCollectionView.extend({
		template: wp.template('grid-element-widget'),
		className:'widget grid-item',
		tagName:'li',
		attributes: {
			'tabindex': 0
		},

		updateDisplay: function() {
			ColumnCollectionView.prototype.updateDisplay.apply( this, arguments );

			this.$('.widget-type').text( this.getTitle() );

			var title = this.model.get('instance').title;
			this.$('.widget-title').text(title);
			if ( ! this.hasColClass() ) {
				this.setColClass( options.screensizes.columns, _.keys( options.screensizes.sizes)[0] );
			}

			return this;
		},
		collectionView: function() { return false },
		getTitle: function( ) {
			var widgetClass = this.model.get('widget_class');
			try {
				return options.widgets[ unescape( widgetClass ) ].name;
			} catch( err ) {
				return l10n.unkonwnWidget + ' ' + widgetClass;
			}
		}
	});

	Cell = grid.view.element.Cell = ColumnCollectionView.extend({
		template: wp.template('grid-element-cell'),
		className:'cell grid-item',
		tagName:'li',
		attributes: {
			'tabindex': 0
		},

		initialize: function() {
			var ret = ColumnCollectionView.prototype.initialize.apply(this,arguments);
			this.listenTo( this.model.items, 'update', this.itemsChanged );
			return ret;
		},
		itemsChanged: function() {
			// let row adjust cell heights
			this.parent().adjustCellSize();
		},
		render: function() {

			ColumnCollectionView.prototype.render.apply(this,arguments);

			var self = this, $dragged, eventProp = 'screenX',
				dragStartX, startOffset;


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
		collectionView: function(){ return Widget },
	});

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
})(jQuery,window.grid);
(function($,grid) {
	var l10n = gridbuilder.l10n, 
		default_widget = gridbuilder.options.default_widget,
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
				autosave		= window.getUserSetting( 'grid-autosave' );

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
			toggleWrapHtml += 			'<input type="checkbox" name="grid_autosave" id="grid_autosave" value="1" '+( autosave ? 'checked' , '' )+' />';
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
		});
		
})(jQuery,window.grid);