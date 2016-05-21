#!/bin/bash

export CLOSURE_COMPILER="/usr/local/compiler-latest/compiler.jar"

combined=./js/gridbuilder.min.js
tmp_min=./js/tmp.js

rm $combined
touch $combined

# minify Sortable
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/Sortable/Sortable.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify Sortable jquery
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/Sortable/jquery.binding.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/grid-base.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/grid-model.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/grid-dialog-views.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/grid-views.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined

# minify grid-base
java -jar \
	$CLOSURE_COMPILER \
	--js ./js/gridbuilder-admin.js \
	--js_output_file $tmp_min

cat $tmp_min >> $combined



# combine

rm $tmp_min
