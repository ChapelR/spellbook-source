// dropdown macro, by chapel (with help from Thomas Michael Edwards); for SugarCube 2
// version 1.2.0

Macro.add('dropdown', {
    handler : function() {
        if (this.args.length < 2) {
            var errors = [];
            if (this.args.length < 1) { errors.push('variable name'); }
            if (this.args.length < 2) { errors.push('list values'); }
            return this.error('no ' + errors.join(' or ') + ' specified');
        }

        // Ensure that the variable name argument is a string.
        if (typeof this.args[0] !== 'string') {
            return this.error('variable name argument is not a string');
        }

        var varName = this.args[0].trim();

        // Try to ensure that we receive the variable's name (incl. sigil), not its value.
        if (varName[0] !== '$' && varName[0] !== '_') {
            return this.error('variable name "' + this.args[0] + '" is missing its sigil ($ or _)');
        }

        // Custom debug view setup.
        if (Config.debug) {
            this.debugView.modes({ block : true });
        }

        var varId      = Util.slugify(varName);
        var listValues = this.args.slice(1).flatten();
        var curValue   = Wikifier.getValue(varName);
        var defaultIdx = 0;
        var el         = document.createElement('select');

        // Set up the option list.
        for (var i = 0; i < listValues.length; ++i) {
            var value = listValues[i];

            if (String(value) === curValue) {
                defaultIdx = i;
            }

            jQuery(document.createElement('option'))
                .text(value)
                .appendTo(el);
        }

        // Set up and append the select element to the output buffer.
        jQuery(el)
            .val(listValues[defaultIdx])
            .attr({
                id       : this.name + '-' + varId,
                name     : this.name + '-' + varId,
                tabindex : 0 // for accessiblity
            })
            .addClass('macro-' + this.name)
            .on('change', function () {
                Wikifier.setValue(varName, this.value);
            })
            .appendTo(this.output);

        // Set the variable to the default value.
        Wikifier.setValue(varName, listValues[defaultIdx]);
    }
});