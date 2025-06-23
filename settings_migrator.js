const DefaultSettings = 
{
	"DEBUG": false,
    "SHAKE_REMOVER": true,
    "AUTO_PET": true,
    "PET_IN_DG": true,
    "PET_BUFF_DG": true,
    "PET_SLOT": 1,
    "AUTO_NOSTRUM": true,
    "AUTO_NOSTRUM_ONLY_DG": false,
    "AUTO_HP_50_POT": false,
    "AUTO_HP_50_POT_PERCENT": 20,
    "AUTO_HP_POT": false,
    "AUTO_HP_POT_PERCENT": 40,
    "AUTO_MP_POT": false,
    "AUTO_MP_POT_PERCENT": 40,
    "BUFFS": true,
    "BROOCH_HEALERS": false
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
                {
                    console.log('<font color=\'#04ACEC\'>DRAGON-UTILITY:</font> Your settings have been updated to version ' + to_ver + '.');
                    console.log('<font color=\'#04ACEC\'>DRAGON-UTILITY:</font> You can edit the new config file after the next relog.');
                }
				
                break;
		}
		return settings;
	}
}