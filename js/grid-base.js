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
		grid = exports.grid = {};

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
		this.$input = $('[name="_grid_data"]');
		var self = this,
			raw = this.$input.attr('value')
			data = JSON.parse( raw );// || [];
		
		this.model = new grid.model.GridObject( data );
		this.subviews = new Backbone.Collection([]);
		this.selected = false;

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
		whichView:function(){
			return this.view.whichView();
		},
		getSelected:function( what ) {
			return this.selected;
		},
		setSelected:function( what ) {
//			console.log(this.selected.$el);
			this.selected = what;
			return this;
		},
		onChangeModel : function() {
			var val = JSON.stringify( this.model.toJSON() );
			// push to undo!
			this.$input.val( val );
		}
	}, Backbone.Events);

	_.extend( exports.grid.controller.Grid, Backbone.Events);

})(jQuery,window)