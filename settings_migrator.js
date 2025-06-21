const DefaultSettings = 
{
	"DEBUG": false,
    "AUTO_NOSTRUM": false,
    "AUTO_NOSTRUM_ONLY_DG": false,
    "AUTO_HP_50_POT": true,
    "AUTO_HP_50_POT_PERCENT": 20,
    "AUTO_HP_POT": true,
    "AUTO_HP_POT_PERCENT": 40,
    "AUTO_MP_POT": true,
    "AUTO_MP_POT_PERCENT": 50,
    "BUFFS": true
}

module.exports = function MigrateSettings(from_ver, to_ver, settings)
{
    if(from_ver === undefined)
    {
        return Object.assign(Object.assign({}, DefaultSettings), settings);
    }
    else if(from_ver === null)
    {
        return DefaultSettings;
    }
    else
    {
		if(from_ver + 1 < to_ver)
        {
			settings = MigrateSettings(from_ver, from_ver + 1, settings);
			return MigrateSettings(from_ver + 1, to_ver, settings);
		}
		switch(to_ver)
        {
			default:
				let oldsettings = settings;
				
                settings = Object.assign(DefaultSettings, {});

				for(let option in oldsettings)
                {
					if(settings[option])
                    {
						settings[option] = oldsettings[option];
					}
				}

				if(from_ver < to_ver)
                    console.log('Your settings have been updated to version ' + to_ver + '. You can edit the new config file after the next relog.');
				
                break;
		}
		return settings;
	}
}