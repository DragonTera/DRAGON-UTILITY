'use strict'

const SettingsUI            = require('tera-mod-ui').Settings;
const path                  = require("path");

const TAG                   = "<font color='#04ACEC'>DRAGON-UTILITY:</font> ";

const NOSTRUM_ID            = [152898, 184659, 201005, 201006, 201007, 201008, 201022, 855604];
const BUFF_NOSTRUM          = [4020, 4021, 4022, 4023, 4030, 4031, 4032, 4044];
const BUFF_INVINCIBILITY    = [1134, 6007];

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
const S_PRIEST              = [430100];
const S_MYSTIC              = [480100];
const S_REAPER              = [160100, 163100, 163200];
const S_GUNNER              = [410101];
const S_BRAWLER             = [180101, 180102, 180130];
const S_NINJA               = [230100];
const S_VALKYRIE            = [250100];

const SKILLS                = [S_WARRIOR, S_LANCER, S_SLAYER, S_BERSERKER, S_SORCERER, S_ARCHER, S_PRIEST, S_MYSTIC, S_REAPER, S_GUNNER, S_BRAWLER, S_NINJA, S_VALKYRIE];
const ITEMS                 = [HP_POTION_50_ID, HP_POTION_ID, MP_POTION_ID, PET_FOOD_ID];

module.exports = function utility(mod)
{
    mod.dispatch.addDefinition("C_START_SERVANT_ACTIVE_SKILL", 2, path.join(__dirname, "defs", "C_START_SERVANT_ACTIVE_SKILL.2.def"));
    mod.dispatch.addDefinition("C_REQUEST_SPAWN_SERVANT", 2, path.join(__dirname, "defs", "C_REQUEST_SPAWN_SERVANT.2.def"));
    mod.dispatch.addDefinition("S_START_COOLTIME_SERVANT_SKILL", 1, path.join(__dirname, "defs", "S_START_COOLTIME_SERVANT_SKILL.1.def"));
    mod.dispatch.addDefinition("S_UPDATE_SERVANT_INFO", 1, path.join(__dirname, "defs", "S_UPDATE_SERVANT_INFO.1.def"));

    mod.game.initialize(['me', 'me.abnormalities', 'contract', 'inventory']);

    let lastMoved   = Date.now();
    let job         = null;
    let model       = null;
    let playerLoc   = null;
    let playerW     = null;

    let clubNostrum = null;
    let taskNostrum = null;

    let petList     = null;
    let petId       = null;
    let petCd       = null;
    let petSkill    = null;
    let taskPet     = null;

    let skillCd     = [false, false, false, false, false, false, false, false, false, false, false, false, false];
    let itemCd      = [false, false, false, false];

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  functions
    //--------------------------------------------------------------------------------------------------------------------------------------
    
    function _useNostrum()
    {
        for(let __buff of BUFF_INVINCIBILITY)
        {
            const abnormality = mod.game.me.abnormalities[__buff];
            if(abnormality){return;}
        }
        
        for(let __buff of BUFF_NOSTRUM)
        {
            const abnormality = mod.game.me.abnormalities[__buff];

            if(abnormality)
            {
                if(abnormality.remaining > 120000 || mod.settings.AUTO_NOSTRUM == false){return;}
            }
        }

        if(!mod.game.isIngame || mod.game.isInLoadingScreen || !mod.game.me.alive || mod.game.me.mounted || mod.game.me.inBattleground || mod.game.contract.active){return;}
		if(!mod.game.me.inDungeon && mod.settings.AUTO_NOSTRUM_ONLY_DG){return;}
        if(clubNostrum != null){mod.send('C_USE_PREMIUM_SLOT', 1, clubNostrum);}

        return;
    }

    const _unfilterChat = (__event) => 
    {
        __event.message = __event.message.replace(/<FONT>(.*?)<\/FONT>/g, "<FONT></FONT>$1");
        return true;
    };

    for(const data of [["S_CHAT", 3],["S_WHISPER", 3],["S_PRIVATE_CHAT", 1],["C_CHAT", 1],["C_WHISPER", 1],])
    {
        mod.hook(...data, {order: 100}, _unfilterChat);
    }

    function _removeEfect(__event)
    {
        const abnormality = mod.game.data.abnormalities.get(__event.id);
        if(abnormality && abnormality.effects.some(effect => effect.type === 244)){return false;}
    }

    function _removeShake()
    {
        mod.clientInterface.configureCameraShake(mod.settings.SHAKE_REMOVER, 0, 0);
        return;
    }

    function _useItens(__item)
    {
        mod.toServer('C_USE_ITEM', 3, 
        {
            gameId: mod.game.me.gameId,
            id: __item,
            dbid: 0,
            amount: 1,
            loc: playerLoc,
            w: playerW,
            unk4: true
        })

        return;
    }

    function _petIndex()
    {
        for(let __i = 0; __i < petList.servants.length; __i++)
        {
            if(petList.servants[__i].slot == (mod.settings.PET_SLOT - 1))
            {
                return __i;
            }
        }

        return (mod.settings.PET_SLOT - 1);
    }

    function _skillPet()
    {
        let __index     = 1000;
        let __taskPet   = null;
        let __retorno   = false;

        if(petId != null && mod.settings.AUTO_PET == true)
        {
            Object.values(mod.game.me.abnormalities).forEach(abnormality => 
            {
                if(abnormality.data.name == "Eternal Power" || abnormality.data.name == "Bracing Force" || abnormality.data.name == "Robust Energy" || abnormality.data.name == "Vibrant Energy")
                {
                    if(abnormality.remaining > 15000)
                    {
                        __retorno = true;
                        return;
                    }
                }
            });

            if(__retorno == true){return;}

            if(mod.settings.PET_BUFF_DG == true && mod.game.me.inDungeon == false){return;}
            else
            {
                clearInterval(__taskPet);
                __taskPet = setInterval(function ()
                {
                    if(petCd == true || petId == null)
                    {
                        if(petSkill == null && petCd == true && petId != null){petSkill = __index - 1;}

                        clearInterval(__taskPet);
                        return;
                    }
                    else
                    {
                        if(petSkill != null)
                        {
                            mod.send("C_START_SERVANT_ACTIVE_SKILL", 2,
                            {
                                gameId: petId.gameId,
                                skill: petSkill
                            });

                            setTimeout(function (){if(petCd == false){petSkill = null;}}, 100);;
                        }
                        else
                        {
                            mod.send("C_START_SERVANT_ACTIVE_SKILL", 2,
                            {
                                gameId: petId.gameId,
                                skill: __index++
                            });
                        }
                    }
                }, 30);
                
                setTimeout(function (){clearInterval(__taskPet);}, 8000);
            }
        }

        return;
    }

    function _summonPet()
    {
        mod.send("C_REQUEST_SPAWN_SERVANT", 2,
        {
            servantId: petList.servants[_petIndex()].id,
            uniqueId: Number(petList.servants[_petIndex()].dbid),
            unk: 0
        });

        return;
    }

    function _removePet()
    {
        mod.send("C_REQUEST_SPAWN_SERVANT", 2,
        {
            servantId: petId.id,
            uniqueId: Number(petId.dbid),
            unk: 0
        });

        return;
    }
    
    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Player event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_LOGIN', mod.majorPatchVersion < 114 ? 14 : 15, (event) => 
    {
        model       = event.templateId;
        job         = (model -10101) % 100;

        skillCd     = [false, false, false, false, false, false, false, false, false, false, false, false, false];
        
        petCd       = false;
        petId       = null;
        petSkill    = null;
        petList     = null;

        setTimeout(function (){mod.command.message('This mod does not work with ping or any ping remover.');}, 10000);

        return;
    });

    mod.hook("C_PLAYER_LOCATION", 5, event =>
    {
		playerLoc   = event.loc;
		playerW     = event.w;

        if([0,1,5,6].indexOf(event.type) > -1)
			lastMoved = Date.now();
	});

    mod.hook("S_VISIT_NEW_SECTION", 1, () => 
	{
        if(mod.settings.AUTO_PET == true)
        {
            if(mod.settings.PET_SLOT <= petList.servants.length)
            {
                if(mod.settings.PET_IN_DG == true)
                {
                    if(mod.game.me.inDungeon)
                    {
                        if(petId == null){_summonPet();}
                        else if(petId != null && petId.dbid != petList.servants[_petIndex()].dbid){_summonPet();}

                    }
                    else if(petId != null){_removePet();}
                }
                else if(petId == null){_summonPet();}
                else if(petId != null && petId.dbid != petList.servants[_petIndex()].dbid){_summonPet();}
            }
        }
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
  
	mod.hook('C_RETURN_TO_LOBBY', 'raw', () =>
    {
		if (Date.now() - lastMoved >= 3600000)
            return false;
	});

    mod.hook('S_PLAY_MOVIE', 1, (event) =>
    {
        if(mod.settings.AUTO_CUTSCENE)
        {
            mod.send('C_END_MOVIE', 1, Object.assign({unk: true}, event));
            return false;
        }
    });

    mod.game.on('enter_game', () => 
    {
        clearInterval(taskNostrum);
        clearInterval(taskPet);

        setTimeout(function ()
        {
            taskNostrum = setInterval(function (){_useNostrum();}, 1500);
            taskPet = setInterval(function (){_skillPet();}, 10000);
        }, 10000);
    });

    mod.game.me.on('resurrect', () => 
    {
        clearInterval(taskNostrum);
        clearInterval(taskPet);
        taskNostrum = setInterval(function (){_useNostrum();}, 1500);
        taskPet = setInterval(function (){_skillPet();}, 10000);
    });

	mod.game.on('leave_game', () => 
    {
        clearInterval(taskNostrum);
        clearInterval(taskPet);
    });

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Remove Efects
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.game.on('leave_loading_screen', () => mod.setTimeout(() => _removeShake(), 1000));

    mod.hook("S_ABNORMALITY_BEGIN", mod.majorPatchVersion <= 106 ? 4 : 5, {order: 10000, filter: {fake: null}}, _removeEfect);
    mod.hook("S_ABNORMALITY_REFRESH", 1, {order: 10000, filter: {fake: null}}, _removeEfect);

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Items event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_PREMIUM_SLOT_DATALIST', 2, event =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_PREMIUM_SLOT_DATALIST: ' + event.id);}
        
        for(let __i = 0; __i < event.sets.length; __i++)
        {
            for(let __j = 0; __j < event.sets[__i].inventory.length; __j++)
            {
                if(NOSTRUM_ID.includes(event.sets[__i].inventory[__j].id) == true)
                {
                    clubNostrum = {
                        set: event.sets[__i].id,
                        slot: event.sets[__i].inventory[__j].slot,
                        type: event.sets[__i].inventory[__j].type,
                        id: event.sets[__i].inventory[__j].id
                    };
                    event.sets[__i].inventory.cooldown = 0n;
                }
            }
        }

        return;
	});

    mod.hook('S_START_COOLTIME_ITEM', 1, event => 
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_START_COOLTIME_ITEM: ' + event.item + ' | ' + event.cooldown);}
        
        for(let __i = 0; __i < ITEMS.length; __i++)
        {
            if(ITEMS[__i].includes(event.item) == true)
            {
                itemCd[__i] = true;
                setTimeout(function (){itemCd[__i] = false;}, event.cooldown * 1000);

                break;
            }
        }
        
        return;
    });

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Pet event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_UPDATE_SERVANT_INFO', 1, event => 
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_UPDATE_SERVANT_INFO: ' + event.id + ' | ' + event.energy);}

        if(event.energy <= 270 && mod.settings.AUTO_PET == true && petId != null){_useItens(PET_FOOD_ID[0]);}

        return;
    });

    mod.hook('S_REQUEST_DESPAWN_SERVANT', 1, event => 
    {
        if(petId != null && petId.gameId == event.gameId)
        {
            petCd    = false;
            petSkill = null;
            petId    = null;
        }

        return;
    });

    mod.hook('S_REQUEST_SPAWN_SERVANT', 4, event => 
    {
        if(event.ownerId == mod.game.me.gameId)
        {
            setTimeout(function (){petId = event}, 100);;
        }

        return;
    });

    mod.hook('S_REQUEST_SERVANT_INFO_LIST', 4, event => 
    {
        petList = event;

        return;
    });

    mod.hook('S_START_COOLTIME_SERVANT_SKILL', 1, event => 
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_START_COOLTIME_SERVANT_SKILL: ' + event.cooltime);}
        
        petCd = true;
        setTimeout(function (){petCd = false;}, event.cooltime);

        return;
    });

    //--------------------------------------------------------------------------------------------------------------------------------------
    //  Player skills event
    //--------------------------------------------------------------------------------------------------------------------------------------

    mod.hook('S_START_COOLTIME_SKILL', mod.majorPatchVersion < 114 ? 3 : 4, (event) =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'S_START_COOLTIME_SKILL: ' + event.skill.id + ' / ' + event.cooldown);}

        if(SKILLS[job].includes(event.skill.id) == true)
        {
            skillCd[job] = true;
            setTimeout(function (){skillCd[job] = false;}, event.cooldown);
        }

        return;
	});

    mod.hook('C_START_SKILL', 7, (event) =>
    {
        if(mod.settings.DEBUG){console.log(TAG + 'C_START_SKILL: ' + event.skill.id);}

        if(skillCd[job] == false && mod.settings.BUFFS == true)
        {
            if(SKILLS[job].includes(event.skill.id) == true)
            {
                if(job == 6 || job == 7)
                {
                    if(mod.settings.BROOCH_HEALERS == true)
                    {
                        for(let __i = 0; __i < BROSCH_ID.length; __i++)
                        {
                            _useItens(BROSCH_ID[__i]);
                        }
                    }
                }
                else
                {
                    for(let __i = 0; __i < BROSCH_ID.length; __i++)
                    {
                        _useItens(BROSCH_ID[__i]);
                    }
                }

                for(let __i = 0; __i < ROOTBEAR_ID.length; __i++)
                {
                    _useItens(ROOTBEAR_ID[__i]);
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
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, {height: 515, width: 700});
        
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