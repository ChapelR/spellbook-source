// version
setup.version = {
    number : 909, // number used to check for update logs
    major : 0,
    minor : 9,
    patch : 9,
    suffix : function () { return (this.major < 1) ? ' - beta' : ''; },
    string : function () { return String(this.major + '.' + this.minor + '.' + this.patch + this.suffix() ); }
};

// configuration settings
Config.history.controls  = false;
Config.history.maxStates = 1;
Config.saves.autosave    = true;
Config.saves.autoload    = true;
Config.saves.version     = { 
    number : setup.version.number, // used for updating saves
    major : setup.version.major,
    minor : setup.version.minor,
    patch : setup.version.patch
};
Config.debug             = false;
Config.loadDelay         = 250;
Config.saves.onLoad = function (save) {
    var lock = LoadScreen.lock(),
        showNotes = false;
    if (!save.version.number || save.version.number !== setup.version.number) {
        // show the patch notes
        showNotes = true;
        Dialog.setup('Patch Notes', 'update-dialog');
        Dialog.wiki(Story.get('Recent').text);
        Dialog.append($(document.createElement('button'))
            .wiki('Dismiss.')
            .addClass('w100-link')
            .ariaClick({ label : 'Dismiss this message.' }, function () {
                Dialog.close();
            }));
    }
    postdisplay['goto-start'] = function (t) {
        // send user to landing page
        delete postdisplay[t];
        Engine.play('Start');
        if (showNotes) {
            // open the dialog as loading is dismissed
            setTimeout( function () {
                Dialog.open();
            }, Config.loadDelay);
        }
        LoadScreen.unlock(lock);
    };
};

window.notify = function (msg) {
    $(document).trigger({
        type    : ':notify',
        message : msg
    });
};