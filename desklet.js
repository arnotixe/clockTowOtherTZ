const Cinnamon = imports.gi.Cinnamon;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Settings = imports.ui.settings;

const Desklet = imports.ui.desklet;

const Lang = imports.lang;
const Mainloop = imports.mainloop;

// FIXME use TIME ZONE instead of +/-, because of daylight savings time! Have to change offset manually for now.
// me: can't figure out Time zone and Date(); for the moment, leaving hackish

// https://github.com/linuxmint/Cinnamon/wiki/Applet,%20Desklet%20and%20Extension%20Settings%20Reference#widget-types-and-required-fields

function MyDesklet(metadata, desklet_id){
    this._init(metadata, desklet_id);
}


MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id){
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);

        this._clockContainer = new St.BoxLayout({vertical:true, style_class: 'clock-container'});
        this._locationContainer =  new St.BoxLayout({vertical:false, style_class: 'date-container'});
        this._hourContainer =  new St.BoxLayout({vertical:false, style_class: 'hour-container'});
        this._dateContainer =  new St.BoxLayout({vertical:false, style_class: 'date-container'});

        this._hour = new St.Label({style_class: "clock-hour-label"});
        this._min = new St.Label({style_class: "clock-min-label"});
        this._sec = new St.Label({style_class: "clock-sec-label"});
        this._date = new St.Label();

        this._location = new St.Label();
        this._locationContainer.add(this._location);

	 try {
            this.settings = new Settings.DeskletSettings(
			this, this.metadata["uuid"], this.instance_id);

          this.settings.bindProperty(Settings.BindingDirection.IN, "location", "location", this._settingchange, null);
          this.settings.bindProperty(Settings.BindingDirection.IN, "offset", "offset", this._settingchange, null);
          this.settings.bindProperty(Settings.BindingDirection.IN, "secson", "secson", this._settingchange, null);
	  this._settingchange();
	} 
	catch (e) {
            global.logError(e);
        } 

        this._hourContainer.add(this._hour);
        this._hourContainer.add(this._min);
        this._hourContainer.add(this._sec);
// should be checkboxed yes/no (visibility CSS?)

        this._dateContainer.add(this._date);
        this._clockContainer.add(this._locationContainer);
        this._clockContainer.add(this._hourContainer);
        this._clockContainer.add(this._dateContainer);
        this.setContent(this._clockContainer);
        this.setHeader(_("ClockOtherTZ"));
        this._updateDate();
    },

    _settingchange: function() {
	this._location.set_text(this.location);
	// FIXME style doesn't seem to work in cinnamon javascript. Hacking by setting seconds txt to "" below, if unset checkbox.
	//this._sec.style.font-size=20;
    },
        
    on_desklet_removed: function() {
	Mainloop.source_remove(this.timeout);
    },

    _updateDate: function(){
       let hourFormat = '%H';
       let minFormat = '%M';
       let secFormat = '%S';
       let dateFormat = '%A,%e %B';
       let displayDate = new Date(new Date().getTime() + 1000*60*60*this.offset);
       this._hour.set_text(displayDate.toLocaleFormat(hourFormat));
       this._min.set_text(displayDate.toLocaleFormat(minFormat));
       this._sec.set_text(displayDate.toLocaleFormat(secFormat));

	if (this.secson) {
	       this._sec.set_text(displayDate.toLocaleFormat(secFormat));
	} else {
	       this._sec.set_text(''); // No seconds
	}
       this._date.set_text(displayDate.toLocaleFormat(dateFormat));
       this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateDate));
    }
}

function main(metadata, desklet_id){
    let desklet = new MyDesklet(metadata, desklet_id);
    return desklet;
}
