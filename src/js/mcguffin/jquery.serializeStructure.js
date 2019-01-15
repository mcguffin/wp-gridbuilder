// jQuery addons
// Serialize form fields recursively into json type object, 
// so for example <input name="record[type][x]" value="1"> becomes { record: {type: {x: 1} } }
// and <input name="record[type][]" value="1"> becomes { record: { type: ['1'] } }

(function($) {
	$.fn.extend( {
		serializeStructure: function() {
			var arr = this.serializeArray(),
				struct = {};

			$.each(arr,function(i,el) {
				var path = el.name.replace(/\]$/,'').split( /\]?\[/ ),
					i = 0, len = path.length, sub = struct, seg;

				for (i;i<len;i++) {
					seg = path[i];
					if ( i == len - 1 ) {
						if ( 'undefined' !== typeof sub.length ) {
							sub.push( el.value );
						} else {
							sub[seg] = el.value;
						}
					} else {
						if ( ! sub[seg] ) {
							if ( path[i+1] === '' ) {
								sub[seg] = [];
							} else {
								sub[seg] = {};
							}
						}
						sub = sub[seg];
					}
				}
				
			});
			return struct;
		}
	});

})( jQuery );