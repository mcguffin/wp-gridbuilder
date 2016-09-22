#!/bin/bash

export CLOSURE_COMPILER="closure-compiler"

combined=./js/admin/edit.min.js
tmp_min=./js/tmp.js

rm $combined
touch $combined

#
#	js/admin/tools.js
#
#java -jar \
	$CLOSURE_COMPILER \
	--js ./js/admin/tools.js \
	--js_output_file ./js/admin/tools.min.js




# js/admin/edit/grid-ui.js
# js/admin/edit/grid-dialog-views.js
# js/admin/edit/grid-element.js
# js/admin/edit.js


# minify Sortable
$CLOSURE_COMPILER \
	--js ./js/Sortable/Sortable.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify Sortable jquery
$CLOSURE_COMPILER \
	--js ./js/Sortable/jquery.binding.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
$CLOSURE_COMPILER \
	--js ./js/admin/edit/grid-base.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
$CLOSURE_COMPILER \
	--js ./js/admin/edit/grid-model.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-ui
$CLOSURE_COMPILER \
	--js ./js/admin/edit/grid-ui.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-dialog-views
$CLOSURE_COMPILER \
	--js ./js/admin/edit/grid-dialog-views.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-element
$CLOSURE_COMPILER \
	--js ./js/admin/edit/grid-element.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
#java -jar \
	$CLOSURE_COMPILER \
	--js ./js/admin/edit.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined


rm $tmp_min
