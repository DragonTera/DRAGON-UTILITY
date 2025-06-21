'use strict'

const SettingsUI = require('tera-mod-ui').Settings;

const TAG = "<font color='#04ACEC'>DRAGON-UTILITY:</font> ";

const BROSCH_ID             = [51029, 51030];
const ROOTBEAR_ID           = [80081];

const HP_POTION_50_ID       = [114, 116];
const HP_POTION_ID          = [6553, 6552];
const MP_POTION_ID          = [6563, 6562];
const PET_FOOD_ID           = [206049];

const HP_POTION_50          = 0;
const HP_POTION             = 1;
const MP_POTION             = 2;
const PET_FOOD              = 3;

const S_WARRIOR             = [200200];
const S_LANCER              = [170200, 170240, 170250];
const S_SLAYER              = [203200, 200300, 200310];
const S_BERSERKER           = [330100];
const S_SORCERER            = [340200, 340230];
const S_ARCHER              = [350100, 350130];
const S_PRIEST              = [805800];
const S_MYSTIC              = [702004];
const S_REAPER              = [160100, 163100, 163200];
const S_GUNNER              = [410101];
const S_BRAWLER             = [180101, 180102, 180130];
const S_NINJA               = [230100];
const S_VALKYRIE            = [250100];

const SKILLS                = [S_WARRIOR, S_LANCER, S_SLAYER, S_BERSERKER, S_SORCERER, S_ARCHER, S_PRIEST, S_MYSTIC, S_REAPER, S_GUNNER, S_BRAWLER, S_NINJA, S_VALKYRIE];
const ITEMS                 = [HP_POTION_50_ID, HP_POTION_ID, MP_POTION_ID, PET_FOOD_ID];

module.exports = function utility(mod)
{
    let job         = null;
    let model       = null;
    let playerId    = null;
    let playerLoc   = null;
    let playerW     = null;
    let skillCd     = [false, false, false, false, false, false, false, false, false, false, false, false, false];
    let itemCd      = [false, false, false, false];

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  functions
    //--------------------------------------------------------------------------------------------------------------------------------------

    function _useItens(__item)
    {
        mod.toServer('C_USE_ITEM', 3, 
        {
            gameId: playerId,
            id: __item,
            dbid: 0,
            amount: 1,
            loc: playerLoc,
            w: playerW,
            unk4: true
        })

        return;
    }

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Player event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_LOGIN', mod.majorPatchVersion < 114 ? 14 : 15, (event) => 
    {
        playerId = event.gameId;
        model    = event.templateId;
        job      = (model -10101) % 100;

        return;
    });

    mod.hook("C_PLAYER_LOCATION", 5, event =>
    {
		playerLoc   = event.loc;
		playerW     = event.w;
	});

    mod.hook('S_PLAYER_STAT_UPDATE', mod.majorPatchVersion < 105 ? 14 : (mod.majorPatchVersion < 108 ? 15 : 17), (event) =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_PLAYER_STAT_UPDATE');}

        if(itemCd[HP_POTION_50] == false && mod.settings.AUTO_HP_50_POT == true && ((Number(event.hp) / Number(event.maxHp)) * 100) < mod.settings.AUTO_HP_50_POT_PERCENT)
        {
            for(let __i = 0; __i < ITEMS[HP_POTION_50].length; __i++)
            {
                _useItens(ITEMS[HP_POTION_50][__i]);
            }
        }
        else if(itemCd[HP_POTION] == false && mod.settings.AUTO_HP_POT == true && ((Number(event.hp) / Number(event.maxHp)) * 100) < mod.settings.AUTO_HP_POT_PERCENT)
        {
            for(let __i = 0; __i < ITEMS[HP_POTION].length; __i++)
            {
                _useItens(ITEMS[HP_POTION][__i]);
            }
        }

        if(itemCd[MP_POTION] == false && mod.settings.AUTO_MP_POT == true && ((event.mp / event.maxMp) * 100) < mod.settings.AUTO_MP_POT_PERCENT)
        {
            for(let __i = 0; __i < ITEMS[MP_POTION].length; __i++)
            {
                _useItens(ITEMS[MP_POTION][__i]);
            }
        }

        return;
    });

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Items event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_PREMIUM_SLOT_DATALIST', 2, event =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_PREMIUM_SLOT_DATALIST: ' + event.id);}

        return;
	});

    mod.hook('C_USE_ITEM', 3, event => 
    {
        if(playerId != event.gameId){return;}
        if(mod.settings.DEBUG){console.log(TAG + 'C_USE_ITEM: ' + event.id);}
        
        return;
    });

    mod.hook('S_START_COOLTIME_ITEM', 1, event => 
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_START_COOLTIME_ITEM: ' + event.item + ' | ' + event.cooldown);}
        
        for(let __i = 0; __i < ITEMS.length; __i++)
        {
            for(let __j = 0; __j < ITEMS[__i].length; __j++)
            {
                if(event.item == ITEMS[__i][__j])
                {
                    itemCd[__i] = true;
                    setTimeout(function (){itemCd[__i] = false;}, event.cooldown * 1000);
    
                    return;
                }
            }
        }
        
        return;
    });

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Cooldown skills event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_START_COOLTIME_SKILL', mod.majorPatchVersion < 114 ? 3 : 4, (event) =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_START_COOLTIME_SKILL: ' + event.skill.id + ' / ' + event.cooldown);}

        for(let __i = 0; __i < SKILLS[job].length; __i++)
        {
            if(event.skill.id == SKILLS[job][__i])
            {
                skillCd[job] = true;
                setTimeout(function (){skillCd[job] = false;}, event.cooldown);
                
                break;
            }
        }

        return;
	});

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Use skills event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('C_START_SKILL', 7, (event) =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'C_START_SKILL: ' + event.skill.id);}

        if(skillCd[job] == false && mod.settings.BUFFS == true)
        {
            for(let __i = 0; __i < SKILLS[job].length; __i++)
            {
                if(event.skill.id == SKILLS[job][__i])
                {
                    for(let __i = 0; __i < ROOTBEAR_ID.length; __i++)
                    {
                        _useItens(ROOTBEAR_ID[__i]);
                    }

                    for(let __i = 0; __i < BROSCH_ID.length; __i++)
                    {
                        _useItens(BROSCH_ID[__i]);
                    }

                    break;
                }
            }
        }

        return;
    });

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Interface
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.command.add(['utility'], () =>
    {
        if(ui){ui.show();}
    });

    let ui = null;
    if(global.TeraProxy.GUIMode)
    {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, {height: 320, width: 700});
        
        ui.on('update', settings => 
        {
            mod.settings = settings;
        });

        this.destructor = () => 
        {
            if(ui)
            {
                ui.close();
                ui = null;
            }
        };
    }
}