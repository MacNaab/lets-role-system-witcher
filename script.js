init = function(sheet) {
    if (sheet.id() === "main") {
		initMain(sheet);
    }else if (sheet.id() === "monster") {
        initMonster(sheet);
    }else if (sheet.id() === "pnj") {
        initPnj(sheet);
    }else if (sheet.id() === "mj") {
        initMJ(sheet);
    }
};

getBarAttributes = function(sheet) {
    if (sheet.id() === "main") {
       return {
            "PS": ["ps_value", "ps_max"],
            "END": ["end_value", "end_max"],
            "Concentration": ["con_value", "con_max"],
        };
    }
	if (sheet.id() === "monster" || sheet.id() === "pnj") {
       return {
            "PS": ["ps_value", "ps_max"],
            "END": ["end_value", "end_max"]
        };
    }
    return {};
};

// Attention pour les timer: wait(timer, rand) pas de rand()!

//------------------- INIT MAIN -----------------------------
const initMain = function(sheet) {
  initCC(sheet);
  initJauges(sheet);
  initEtat(sheet);
  jet(sheet);
  initCombat(sheet);
  initOption(sheet);
  log('fin de l\'initiation!')
}

//region ------------------- Caract & Compt -----------------------------
	// Sommes Poings & Pieds à faire
const initCC = function(sheet){
	cII(sheet);
	sheet.get('class').on('update', function(){cII(sheet);});
	// Sommes Poings & Pieds
	var list2 = ['POINGS','PIEDS']
	list2.forEach(function(e){
		SommesPP(sheet,e);
		sheet.get(e+'_1').on("update", function(){SommesPP(sheet,e);});
		sheet.get(e+'_2').on("update", function(){SommesPP(sheet,e);});
		sheet.get(e+'_0').on('click', function(){
			var affichage = _('Dégâts: ');
			var aff = affichage+e;
			var o = sheet.get(e+'_3').text();
			Dommages(sheet,aff,o)
		});
	});
	
	// Jauges
	var list4 = [
		{"N":"ps_max","V":"PS"},
		{"N":"end_max","V":"END"},
		{"N":"con_max","V":"CON"},
		{"N":"vigueur","V":"VIG"},
		{"N":"enc_max","V":"ENC"},
	];
	list4.forEach(function(e){
		sheet.get(e.N).value(sheet.get(e.V+'_3').text());
		sheet.get(e.V+'_3').on('update', function(){
			sheet.get(e.N).value(sheet.get(e.V+'_3').text());
		});
	});

	ComptCom(sheet);
	sheet.get('Repeat_CE').on('update', function(){Inventaire(sheet);});
}

// Calcul Caractéristiques Secondaires
const cII = function(sheet){
	var line = Tables.get("class_list").get(sheet.get('class').value());
	var poings = CoupPoings(sheet.get('COR_3').value());
	var pieds = CoupPieds(sheet.get('COR_3').value());
	sheet.setData({
    	"VIG_1": line.vigueur,
    	"VIG_3": Number(line.vigueur)+Number(sheet.get('VIG_2').text()),
	    "POINGS_1": poings,
		"PIEDS_1": pieds
	});
}

function SommesPP(sheet,e){
		var a = sheet.get(e+'_1').text();
		var b = sheet.get(e+'_2').text();
			if(b == ''||b==null){return sheet.get(e+'_3').value(a);}
		var c = a.split('+');
  			if(c[1]){var d = -Number(c[1])+Number(b);}
			if(!c[1]){c= a.split('-');var d = -Number(c[1])+Number(b);}
			if(!c[1]){var d = Number(b);}
  		if(d>0){var f = c[0]+'+'+d;}else{var f = c[0]+d;}
		  sheet.get(e+'_3').value(f);
}

// Compétence complémentaire
const ComptCom = function(sheet){
    let compt = sheet.get('Repeat_CE').value();  // Repeat_CE is the id of the repeater
    each(compt, function(entryData, entryIndex) {
        let cptName = "Repeat_CE."+entryIndex+".rjrpkmmo";  // rjrpkmmo is the id of the component you want to change
        let cpt = sheet.get(cptName);
        if(cpt != null){
            cpt.on("click", function(){
				var aff = sheet.get("Repeat_CE."+entryIndex+".rjrpkmmo").value();
				var car = sheet.get("Repeat_CE."+entryIndex+".pkspyssx").value();	// Caractéristique
					if(car == "Aucune"){var b1 = 0;	}else{
						var car_min = Tables.get("caract_base_list").get(car);
						var b1 = sheet.get(car_min.effet+'_3').value();
					}
				var b2 = Number(sheet.get("Repeat_CE."+entryIndex+".xsyktecn").value())+Number(sheet.get("Repeat_CE."+entryIndex+".bqltmttj").value());
				var b = Number(b1)+Number(b2);
				Roll_P1(sheet,aff,b);
			});
        }else{
            log("Component ["+cptName+"] not found!");
        }
    });
}

function CoupPoings(e){
  var f = 0;if(e%2 != 0){f = Math.trunc(e/2)+1;}else{f = Math.trunc(e/2);}
  var g = -4+2*f;if(g==0){g="";}if(g>0){g='+'+g;}
  return '1d6'+g;
}
function CoupPieds(e){
  var f = 0;if(e%2 != 0){f = Math.trunc(e/2)+1;}else{f = Math.trunc(e/2);}
  var g = 0+2*f;if(g==0){g="";}if(g>0){g='+'+g;}
  return '1d6'+g;
}
//endregion

//region------------------- Jauges -----------------------------
const initJauges = function(sheet){
  let a = ['ps','end','con']; // liste des id des jauges
  a.forEach(function(i){
  	Jauges(sheet,i,100,10);
    JaugesPlusetMoins(sheet,i,100,10);
	sheet.get(i+'_value').on("update", function(){Jauges(sheet,i,100,10);});
  });
};

const Jauges = function(sheet,idjauge,echelle,pas){
	let TabClass = [];	
	TabClass['con'] = 'bg-primary'; 	TabClass['ps'] = 'bg-danger';	TabClass['end'] = 'bg-success';
	let max = Number(sheet.get(idjauge+'_max').value());
	let current = Number(sheet.get(idjauge+'_value').value());
	let niveau = echelle * current / max;
	for(let i = 0 ; i < echelle+pas ; i+=pas){
		if( niveau == 0 ){sheet.get('jauge_'+idjauge+'_'+i).removeClass(TabClass[idjauge]);};
		if( niveau < i ){sheet.get('jauge_'+idjauge+'_'+i).removeClass(TabClass[idjauge]);}
		else{sheet.get('jauge_'+idjauge+'_'+i).addClass(TabClass[idjauge]);};
	};

};

const JaugesPlusetMoins = function(sheet,idjauge){
	sheet.get('jauge_'+idjauge+'_plus').on("click", function(){
		let max = Number(sheet.get(idjauge+'_max').value());
		let current = Number(sheet.get(idjauge+'_value').value());
		if( current+1 <= max ){
			wait(250, function(){
			sheet.get(idjauge+'_value').value(current+1);
			});
		};

	});

	sheet.get('jauge_'+idjauge+'_moins').on("click", function(){
		let max = Number(sheet.get(idjauge+'_max').value());
		let current = Number(sheet.get(idjauge+'_value').value());

		if( current-1 >= 0 ){
			wait(250, function(){
				sheet.get(idjauge+'_value').value(current-1);
			});
		};
	});

};
//endregion

//region------------------- État -----------------------------
const initEtat = function(sheet){
	wait(1000,Inventaire(sheet));
	wait(1000,Etat(sheet));

		sheet.get('BC_repeat').on('update', function(){Etat(sheet);});
		sheet.get('NM_repeat').on('update', function(){Etat(sheet);});
		sheet.get('race').on('update', function(){Etat(sheet);});
		sheet.get('origin').on('update', function(){Etat(sheet);});
		sheet.get('VE').on('update', function(){Etat(sheet);});

		sheet.get('enc').on('update', function(){Etat(sheet);});

		sheet.get('arme_repeater').on('update', function(){Inventaire(sheet);});
		sheet.get('armure_repeater').on('update', function(){Inventaire(sheet);});
		sheet.get('inventaire_repeater').on('update', function(){Inventaire(sheet);});
		sheet.get('compo_repeater').on('update', function(){Inventaire(sheet);});

	each(sheet.get('armure_repeater').value(), function (entryData, entryIndex){
		let paa = "armure_repeater."+entryIndex+".pa";  // PA actuelle
		sheet.get(paa).on('update', function(){
			PAarmure(sheet);
		});
	});

}

function Etat(sheet){
	var Stock_Data = sheet.getData();
	// Reini tous les mod:
	var list1 = ['INT','REF','DEX','COR','VIT','EMP','TEC','VOL','CHA','VIG','ETOU','COU','SAUT','PS','END','ENC','REC','CON','POINGS','PIEDS'];
	var timer = 0
	list1.forEach(function(e){
		timer += 500;
		Stock_Data[e+"_2"] = 0;
	});
	var list2 = [
		{'N':'RUE','V':'INT'},
		{'N':'MON','V':'INT'},
		{'N':'DED','V':'INT'},
		{'N':'EDU','V':'INT'},
		{'N':'ENS','V':'INT'},
		{'N':'ETQ','V':'INT'},
		{'N':'LAN','V':'INT'},
		{'N':'LCO','V':'INT'},
		{'N':'LNA','V':'INT'},
		{'N':'NEG','V':'INT'},
		{'N':'SUR','V':'INT'},
		{'N':'TAC','V':'INT'},
		{'N':'VIGi','V':'INT'},
		{'N':'BAG','V':'REF'},
		{'N':'BAT','V':'REF'},
		{'N':'EQUI','V':'REF'},
		{'N':'ESC','V':'REF'},
		{'N':'ESQ','V':'REF'},
		{'N':'LAM','V':'REF'},
		{'N':'MEL','V':'REF'},
		{'N':'NAV','V':'REF'},
		{'N':'ADR','V':'DEX'},
		{'N':'ARB','V':'DEX'},
		{'N':'ARC','V':'DEX'},
		{'N':'ATH','V':'DEX'},
		{'N':'FUR','V':'DEX'},
		{'N':'PHY','V':'COR'},
		{'N':'RES','V':'COR'},
		{'N':'BEAU','V':'EMP'},
		{'N':'CHAR','V':'EMP'},
		{'N':'COM','V':'EMP'},
		{'N':'DUP','V':'EMP'},
		{'N':'JEU','V':'EMP'},
		{'N':'PER','V':'EMP'},
		{'N':'PSY','V':'EMP'},
		{'N':'REP','V':'EMP'},
		{'N':'SED','V':'EMP'},
		{'N':'STYL','V':'EMP'},
		{'N':'ALC','V':'TEC'},
		{'N':'ART','V':'TEC'},
		{'N':'CONT','V':'TEC'},
		{'N':'CRO','V':'TEC'},
		{'N':'DEG','V':'TEC'},
		{'N':'PIEGE','V':'TEC'},
		{'N':'SOI','V':'TEC'},
		{'N':'COUR','V':'VOL'},
		{'N':'ENV','V':'VOL'},
		{'N':'INC','V':'VOL'},
		{'N':'INTI','V':'VOL'},
		{'N':'RCON','V':'VOL'},
		{'N':'RMAG','V':'VOL'},
		{'N':'RIT','V':'VOL'},
	];
	timer=0;
	list2.forEach(function(e){
		timer += 500;
		Stock_Data[e.N+"_2"] = 0;
	});

	// Race
	var race = sheet.get('race').value();
		var line_race = Tables.get("race_list").get(race);
		if(line_race.i != '0'){
			var a = line_race.text.split('<br>');
			var aff = 'Race: ';
				a.forEach(function(e){
					aff += '\n'+e;
				});
			sheet.get('Etat_race').value(aff);
			if(line_race.c != null && line_race != ""){
				var a = line_race.c.split(',');
				a.forEach(function(e){
					var b = e.split(' ');
					Stock_Data[b[1]+"_2"] += Number(b[0]);
				});
			}
		}
	// Origine
	var ori = sheet.get('origin').value();
		if(ori != 0){
			var line_ori = Tables.get("origine_list").get(ori);
					Stock_Data[line_ori.min+"_2"] += 1;
			var affichage = _("Terre d'origine: +1 ");
			sheet.get('Etat_ori').value(affichage+line_ori.effet);
		}

	// Blessure
	function Blessure(){
		var aff = _("Blessure critique:");
		each(sheet.get('BC_repeat').value(), function (entryData, entryIndex) {
			let entry = sheet.get('BC_repeat').find(entryIndex);	// ligne
			let entry1 = entry.find('Blessure_1').value(); // nom
			let entry2 = entry.find('Blessure_2').value(); // stade
				var stade = Tables.get("blessure_mode_list").get(entry2).desc;
				if(stade == 0){stade='critique';var min='c'}else if(stade == 1){stade='stabilise';var min='s';}else{stade='traite';var min='t';}
			var line = Tables.get("blessure_list").get(entry1);
			aff += '\n'+entry1+" - "+entry2+" ("+line[stade]+")";
			if(line[min] == '4c'){
				Stock_Data['REC_2'] += -Math.round(Number(Stock_Data['REC_3'])*0.75);
			}else if(line[min] == '4s'){
				Stock_Data['REC_2'] += -Math.round(Number(Stock_Data['REC_3'])*0.5);
			}else if(line[min] == '18c' || line[min] == '24c' || line[min] == '24s'){
				Stock_Data['VIT_2'] += -Math.round(Number(Stock_Data['VIT_3'])*0.75);
				Stock_Data['ESQ_2'] += -Math.round(Number(Stock_Data['ESQ_3'])*0.75);
				Stock_Data['ATH_2'] += -Math.round(Number(Stock_Data['ATH_3'])*0.75);
			}else if(line[min] == '18s'){
				Stock_Data['VIT_2'] += -Math.round(Number(Stock_Data['VIT_3'])*0.5);
				Stock_Data['ESQ_2'] += -Math.round(Number(Stock_Data['ESQ_3'])*0.5);
				Stock_Data['ATH_2'] += -Math.round(Number(Stock_Data['ATH_3'])*0.5);
			}else if(line[min] == '21c'){
				Stock_Data['VIT_2'] += -Math.round(Number(Stock_Data['VIT_3'])*0.75);
				Stock_Data['END_2'] += -Math.round(Number(Stock_Data['END_3'])*0.75);
				Stock_Data['COR_2'] += -Math.round(Number(Stock_Data['COR_3'])*0.75);
			}else if(line[min] == '21s'){
				Stock_Data['VIT_2'] += -Math.round(Number(Stock_Data['VIT_3'])*0.5);
				Stock_Data['END_2'] += -Math.round(Number(Stock_Data['END_3'])*0.5);
				Stock_Data['COR_2'] += -Math.round(Number(Stock_Data['COR_3'])*0.5);
			}else if(line[min] == '22c'){
				Stock_Data['END_2'] += -Math.round(Number(Stock_Data['END_3'])*0.5);
				Stock_Data['INT_2'] += -3;Stock_Data['VOL_2'] += -3;Stock_Data['REF_2'] += -3;Stock_Data['DEX_2'] += -3;
			}else if(line[min] == '22s'){
				Stock_Data['END_2'] += -Math.round(Number(Stock_Data['END_3'])*0.5);
				Stock_Data['INT_2'] += -1;Stock_Data['VOL_2'] += -1;Stock_Data['REF_2'] += -1;Stock_Data['DEX_2'] += -1;
			}else{
				var a = line[min].split(',');
				a.forEach(function(e){
					var b = e.split(' ');
					Stock_Data[b[1]+"_2"] += Number(b[0]);
				});
			}
		});
		sheet.get('Etat_BC').value(aff);
	}
	Blessure();

	// Nmod
	function Nmod(){
		var aff = "";
		each(sheet.get('NM_repeat').value(), function (entryData, entryIndex) {
			let entry = sheet.get('NM_repeat').find(entryIndex);	// ligne
			let entry1 = entry.find('Nmod_1').value(); // nom
			let e2 = entry.find('Nmod_2').value(); // c
				var line = Tables.get("new_mod_list").get(e2);
				let entry2 = line.ref;
			let entry3 = entry.find('Nmod_3').value(); // val
				Stock_Data[entry2+"_2"] += Number(entry3);
			if(Number(entry3)>0){entry3="+"+entry3;}
			aff += '\n'+entry1+" ("+entry3+" "+entry2+")";
		});
		sheet.get('Etat_Nmod').value(aff);
	}
	Nmod();

	// ENC
	var ENC = Number(Stock_Data.enc)-Number(Stock_Data.ENC_3);
		if(ENC>0){
			Stock_Data['REF_2'] += -(Math.floor(Number(-ENC)/5)+1);
			Stock_Data['DEX_2'] += -(Math.floor(Number(-ENC)/5)+1);
			Stock_Data['VIT_2'] += -(Math.floor(Number(-ENC)/5)+1);
			sheet.get('Etat_ENC').value('Encombré: '+Stock_Data.enc+'/'+Stock_Data.ENC_3+' (-'+(Math.floor(Number(-ENC)/5)+1)+' REF, DEX et VIT)');
		}else{
			sheet.get('Etat_ENC').value('');
		}

	// Valeur Encombrement
	var VE = sheet.get('VE').value();
	if(VE > 0){
		Stock_Data["REF_2"] += Number(VE);
		Stock_Data["DEX_2"] += Number(VE);
		var affichage = _('Valeur Encombrement: ');
		sheet.get('Etat_VE').value(affichage+VE+' (-'+VE+' REF et DEX)');
	}else{sheet.get('Etat_VE').value('');}

	list1.forEach(function(e){
		if(Stock_Data[e+"_2"] != sheet.get(e+"_2").text()){
			let ladata = {}
				ladata[e+"_2"] = Stock_Data[e+"_2"];
				ladata[e+"_3"] = Number(Stock_Data[e+"_2"])+Number(Stock_Data[e+"_1"]);
			sheet.setData(ladata);
		}
	});		
	timer=0;
	list2.forEach(function(e){
		if(Stock_Data[e.N+"_2"] != sheet.get(e.N+"_2").value()){
			wait(timer, sheet.get(e.N+"_2").value(Stock_Data[e.N+"_2"]));
			timer += 500;
		}
	});
}

function Inventaire(sheet){
	var poids = 0;var VE = 0;var focus=0;
	var tete = {max:0,a:0};
	var torse = {max:0,a:0};
	var pant = {max:0,a:0};
	each(sheet.get('arme_repeater').value(), function (entryData, entryIndex){
		let entry = sheet.get('arme_repeater').find(entryIndex);	// ligne
		let entry1 = entry.find('arme_11').value();
		let entry2 = entry.find('arme_focus').value();
			if(entry2==null||entry2==''){entry2=0;}		
		poids += Number(entry1);
		focus += Number(entry2);
	});
	each(sheet.get('armure_repeater').value(), function (entryData, entryIndex){
		let entry = sheet.get('armure_repeater').find(entryIndex);	// ligne
		let entry1 = entry.find('armor_7').value();	// poids
		poids += Number(entry1);
		let entry2 = entry.find('armor_2').value();	// Type
			var line = Tables.get("amortype_list").get(entry2);
		let entry3 = entry.find('armor_3').value();	// PA max
		let paa = "armure_repeater."+entryIndex+".pa";  // PA actuelle
		let	entry5 = sheet.get(paa).value();
		let entry4 = entry.find('armor_6').value();	// VE
		poids += Number(entry4);

		function calculpa(e,ee,eee){
			// e:	1 = tete	2 = torse	3 = pant
			// ee:	max ou a
			// eee: valeur à comparer
			if(e==1){
				if(tete[ee] != 0){
					var a = Number(tete[ee]);var b = Number(eee);
					if(b>a){a=b;b=Number(tete[ee]);}	// a > b
					let diff = Math.abs(Number(tete[ee])-Number(eee));	// différence PA
					if(diff <= 4){tete[ee] = Number(a)+5;}else 
					if(diff <= 8){tete[ee] = Number(a)+4;}else 
					if(diff <= 14){tete[ee] = Number(a)+3;}else 
					if(diff <= 20){tete[ee] = Number(a)+2;}else{tete[ee] = Number(a);} 
				}else{tete[ee] += Number(eee);}
			}else if(e==2){
				if(torse[ee] != 0){
					var a = Number(torse[ee]);var b = Number(eee);
					if(b>a){a=b;b=Number(torse[ee]);}	// a > b
					let diff = Math.abs(Number(torse[ee])-Number(eee));	// différence PA
					if(diff <= 4){torse[ee] = Number(a)+5;}else 
					if(diff <= 8){torse[ee] = Number(a)+4;}else 
					if(diff <= 14){torse[ee] = Number(a)+3;}else 
					if(diff <= 20){torse[ee] = Number(a)+2;}else{torse[ee] = Number(a);} 
				}else{torse[ee] += Number(eee);}
			}else{
				if(pant[ee] != 0){
					var a = Number(pant[ee]);var b = Number(eee);
					if(b>a){a=b;b=Number(pant[ee]);}	// a > b
					let diff = Math.abs(Number(pant[ee])-Number(eee));	// différence PA
					if(diff <= 4){pant[ee] = Number(a)+5;}else 
					if(diff <= 8){pant[ee] = Number(a)+4;}else 
					if(diff <= 14){pant[ee] = Number(a)+3;}else 
					if(diff <= 20){pant[ee] = Number(a)+2;}else{pant[ee] = Number(a);} 
				}else{pant[ee] += Number(eee);}
			}
		}

		if(line.i == '1'){calculpa(1,'max',entry3);calculpa(1,'a',entry5);};
		if(line.i == '12'){calculpa(1,'max',entry3);calculpa(1,'a',entry5);calculpa(2,'max',entry3);calculpa(2,'a',entry5);};
		if(line.i == '123'){calculpa(1,'max',entry3);calculpa(1,'a',entry5);calculpa(2,'max',entry3);calculpa(2,'a',entry5);calculpa(3,'max',entry3);calculpa(3,'a',entry5);};
		if(line.i == '2'){calculpa(2,'max',entry3);calculpa(2,'a',entry5);};
		if(line.i == '23'){calculpa(2,'max',entry3);calculpa(2,'a',entry5);calculpa(3,'max',entry3);calculpa(3,'a',entry5);};
		if(line.i == '3'){calculpa(3,'max',entry3);calculpa(3,'a',entry5);};
	});
	each(sheet.get('inventaire_repeater').value(), function (entryData, entryIndex){
		let entry = sheet.get('inventaire_repeater').find(entryIndex);	// ligne
		let entry1 = entry.find('inv_4').value(); // Quantité
		let entry2 = entry.find('inv_5').value(); // Poids
		poids += Number(entry1)*Number(entry2);
	});
	each(sheet.get('compo_repeater').value(), function (entryData, entryIndex){
		let entry = sheet.get('compo_repeater').find(entryIndex);	// ligne
		let entry1 = entry.find('inv_4').value(); // Quantité
		let entry2 = entry.find('inv_5').value(); // Poids
		poids += Number(entry1)*Number(entry2);
	});
	sheet.setData({
    	"enc": poids,
	    "VE": VE,
		"focus": focus,
		"pa_tete_max": tete.max,
		"pa_tete": tete.a,
		"pa_torse_max": torse.max,
		"pa_torse": torse.a,
		"pa_jambes_max": pant.max,
		"pa_jambes": pant.a
	});
}

function PAarmure(sheet){
	var tete = {max:0,a:0};
	var torse = {max:0,a:0};
	var pant = {max:0,a:0};
	each(sheet.get('armure_repeater').value(), function (entryData, entryIndex){
		let entry = sheet.get('armure_repeater').find(entryIndex);	// ligne
		let entry2 = entry.find('armor_2').value();	// Type
			var line = Tables.get("amortype_list").get(entry2);
		let paa = "armure_repeater."+entryIndex+".pa";  // PA actuelle
		let	entry5 = sheet.get(paa).value();

		function calculpa(e,ee,eee){
			// e:	1 = tete	2 = torse	3 = pant
			// ee:	max ou a
			// eee: valeur à comparer
			if(e==1){
				if(tete[ee] != 0){
					var a = Number(tete[ee]);var b = Number(eee);
					if(b>a){a=b;b=Number(tete[ee]);}	// a > b
					let diff = Math.abs(Number(tete[ee])-Number(eee));	// différence PA
					if(diff <= 4){tete[ee] = Number(a)+5;}else 
					if(diff <= 8){tete[ee] = Number(a)+4;}else 
					if(diff <= 14){tete[ee] = Number(a)+3;}else 
					if(diff <= 20){tete[ee] = Number(a)+2;}else{tete[ee] = Number(a);} 
				}else{tete[ee] += Number(eee);}
			}else if(e==2){
				if(torse[ee] != 0){
					var a = Number(torse[ee]);var b = Number(eee);
					if(b>a){a=b;b=Number(torse[ee]);}	// a > b
					let diff = Math.abs(Number(torse[ee])-Number(eee));	// différence PA
					if(diff <= 4){torse[ee] = Number(a)+5;}else 
					if(diff <= 8){torse[ee] = Number(a)+4;}else 
					if(diff <= 14){torse[ee] = Number(a)+3;}else 
					if(diff <= 20){torse[ee] = Number(a)+2;}else{torse[ee] = Number(a);} 
				}else{torse[ee] += Number(eee);}
			}else{
				if(pant[ee] != 0){
					var a = Number(pant[ee]);var b = Number(eee);
					if(b>a){a=b;b=Number(pant[ee]);}	// a > b
					let diff = Math.abs(Number(pant[ee])-Number(eee));	// différence PA
					if(diff <= 4){pant[ee] = Number(a)+5;}else 
					if(diff <= 8){pant[ee] = Number(a)+4;}else 
					if(diff <= 14){pant[ee] = Number(a)+3;}else 
					if(diff <= 20){pant[ee] = Number(a)+2;}else{pant[ee] = Number(a);} 
				}else{pant[ee] += Number(eee);}
			}
		}

		if(line.i == '1'){calculpa(1,'a',entry5);};
		if(line.i == '12'){calculpa(1,'a',entry5);calculpa(2,'a',entry5);};
		if(line.i == '123'){calculpa(1,'a',entry5);calculpa(2,'a',entry5);calculpa(3,'a',entry5);};
		if(line.i == '2'){calculpa(2,'a',entry5);};
		if(line.i == '23'){calculpa(2,'a',entry5);calculpa(3,'a',entry5);};
		if(line.i == '3'){calculpa(3,'a',entry5);};
	});
	sheet.setData({
		"pa_tete": tete.a,
		"pa_torse": torse.a,
		"pa_jambes": pant.a
	});
}
//endregion

//region------------------- Combat -----------------------------
const initCombat = function(sheet){
	var arm_t = [];	// table des armes
		
	function initArm(id){	// id = repeater
		arm_t = [];	// reini
		var choice_cac = {};
		var choice_dist = {};
		var choice_dble = {};
		each(sheet.get(id).value(), function (entryData, entryIndex) {	// Armes
			let entry = sheet.get(id).find(entryIndex);
			arm_t.push(entry.value());
			let entry1 = entry.find('arme_1').value(); // nom
			let entry22 = entry.find('arme_22').value(); // type
			let line = Tables.get("arme_list").get(entry22);
				if(line.type == 'cac'){choice_cac[entry1] = entry1;}else{choice_dist[entry1] = entry1;}
			choice_dble[entry1] = entry1;
		});
		try {sheet.get('arm_1').setChoices(choice_cac);} catch (error) {}
		try {sheet.get('arm_2').setChoices(choice_dist);} catch (error) {}
		try {sheet.get('arm_3').setChoices(choice_dble);} catch (error) {}
	};

	initArm('arme_repeater'); // ajout des armes de la fiche
	sheet.get('arme_repeater').on('update', function(){initArm('arme_repeater');});

	sheet.get('ATQ_cac_roll').on('click', function(){	// ATQ CaC
		var arme = sheet.get('arm_1').value();
		var line;
			arm_t.forEach(function(e){
				if(e.arme_1 == arme){line = e;}
			});
		var c = Number(sheet.get('cac_1').value())+Number(sheet.get('cac_2').value())+Number(sheet.get('cac_3').value())+Number(sheet.get('cac_4').value())+Number(line.arme_3);

		let line2 = Tables.get("arme_list").get(line.arme_22);

		var affichage = _('Jet ');
		var aff = affichage+arme;
			var b_1 = sheet.get(line2.c+'_3').value();
				if(b_1==""||b_1==null){b_1=0;}
			var b_2 = sheet.get(line2.compt+'_3').value();
				if(b_2==""||b_2==null){b_2=0;}	
			var b = Number(b_1)+Number(b_2);

		var v = 'visible';
		var lejet = new RollBuilder(sheet);
		lejet.expression('1d10')
		.visibility(v)
		.onRoll(function(result){
			var a = result.values[0];
			Roll_Cust(sheet,aff,a,b,c,v);
		})
		.roll();
	});

	sheet.get('ATQ_dist_roll').on('click', function(){	// ATQ Distance
		var arme = sheet.get('arm_2').value();
		var line;
			arm_t.forEach(function(e){
				if(e.arme_1 == arme){line = e;}
			});
		var c = Number(sheet.get('dist_1').value())+Number(sheet.get('dist_2').value())+Number(sheet.get('dist_3').value())+Number(sheet.get('dist_4').value())+Number(sheet.get('dist_5').value())+Number(line.arme_3);

		let line2 = Tables.get("arme_list").get(line.arme_22);

		var affichage = _('Jet ');
		var aff = affichage+arme;
			var b_1 = sheet.get(line2.c+'_3').value();
				if(b_1==""||b_1==null){b_1=0;}
			var b_2 = sheet.get(line2.compt+'_3').value();
				if(b_2==""||b_2==null){b_2=0;}	
			var b = Number(b_1)+Number(b_2);

		var v = 'visible';
		var lejet = new RollBuilder(sheet);
		lejet.expression('1d10')
		.visibility(v)
		.onRoll(function(result){
			var a = result.values[0];
			Roll_Cust(sheet,aff,a,b,c,v);
		})
		.roll();
	});

	sheet.get('ATQ_calc').on('click', function(){
		var atq = sheet.get('ATQ_calc1').value();
		var loc = sheet.get('ATQ_calc2').value();
			var line0 = Tables.get("loc_list").get(loc);
			var mod = line0.malus;
		var def = sheet.get('ATQ_calc3').value();
		var som = Number(atq)-Number(mod)-Number(def);
			if(som<=0){
				let line = _("Échec de l'attaque!");
				var aff = line+" ("+(Number(atq)-Number(mod))+" VS "+def+")";
			}else{
				let line = _("Réussite de l'attaque!");
				var aff = line+" ("+(Number(atq)-Number(mod))+" VS "+def+")";
				if(som >6){
					// Calcul des CC
					if(loc == 0){	// Pas de visée
						var lejet = new RollBuilder(sheet);
							lejet.expression('2d6')
							.onRoll(function(result){
								var a = result.values[0]+result.values[1];
								CC(sheet,a,som,loc,'ATQ_calc0');
							})
							.roll();
					}else if(loc!=5){	// visée
						if(loc==1||loc==2){
							var lejet = new RollBuilder(sheet);
							lejet.expression('1d6')
							.onRoll(function(result){
								var a = result.values[0];
								CC(sheet,a,som,loc,'ATQ_calc0');
							})
							.roll();
						}else{
							CC(sheet,0,som,loc,'ATQ_calc0');
						}
					}
				}else{
					sheet.get('Dom_5').value(0);
					sheet.get('ATQ_calc0').text('');
				}
			}
		sheet.get('ATQ_calc00').text(aff);
	});

	sheet.get('dommages_roll').on('click', function(){	// Dommages
		// Dégâts: ([(dmg + modCor)*FP]-PA)*loca*RV + cc

		if(sheet.get('Dom_1').value() != null && sheet.get('Dom_1').value() != ''){
			var dmg = sheet.get('Dom_1').value();
			var affichage = _('Dégâts: ');
			var aff = affichage+dmg;
		}else{
			var arme = sheet.get('arm_3').value();
			var affichage = _('Dégâts: ');
			var aff = affichage+arme; var line;
			arm_t.forEach(function(e){
				if(e.arme_1 == arme){line = e;}
			});
			try {
  				var dmg = line.arme_4;
			} catch (error) {
				return error;	// Fin de la fonction
			}
		}
		var c = dmg.split('+');
			if(c[1]){
				var dice = Dice.create(c[0]).add(c[1]);
			}else{
				c=dmg.split('-');
				if(c[1]){var dice = Dice.create(c[0]).minus(c[1]);}else{var dice = Dice.create(c[0]);}
			}
		if(sheet.get('Dom_3A').value() == true){
			var Cor = Number(sheet.get('COR_3').text());
			var modCor = -4 + (2*(Math.ceil(Cor)/2)-1);
			dice = dice.add(modCor);
		}
		if(sheet.get('Dom_3B').value() == true){
			dice = dice.multiply(2);
		}
		var PA = sheet.get('Dom_7').value();if(PA == null || PA == ''){PA=0;}
			dice = dice.minus(PA);
		if(sheet.get('Dom_2').value()==0){
			// Random loc;
			var Rand = Math.floor(Math.random() * Math.floor(10))+1;
			if(sheet.get('Dom_3B').value() == true){
				if(Rand == '1'){var a = '1';var b = "Tête";}
				if(Rand > '1' && Rand < '6'){var a = '2';var b = "Torse";}
				if(Rand > '5' && Rand < '10'){var a = '3';var b = "Membre gauche";}
				if(Rand == '10'){var a = '4';var b = "Queue ou Aile";}
			}
			else{
				if(Rand == '1'){var a = '1';var b = "Tête";}
				if(Rand > '1' && Rand < '5'){var a = '2';var b = "Torse";}
				if(Rand == '5'){var a = '3';var b = "Bras droit";}
				if(Rand == '6'){var a = '3';var b = "Bras gauche";}
				if(Rand > '6'){var a = '4';var b = "Jambe";}
			}
			var loca_line = Tables.get("loc_list").get(a);
			aff += " ("+loca_line.loc+")";
			var loca = Number(loca_line.mult);
		}else{
			var loca_line = Tables.get("loc_list").get(sheet.get('Dom_2').value());
			aff += " ("+loca_line.loc+")";
			var loca = Number(loca_line.mult);
		}
		dice = dice.multiply(loca);
		var RV = Number(sheet.get('Dom_6').value());
			if(RV!=1){dice = dice.multiply(RV);}
		var cc = Number(sheet.get('Dom_5').value());
			if(cc>0){dice.add(cc);}
		
		Dice.roll(sheet, dice, aff);
	});

	sheet.get('dmg_complet_roll').on('click',function(){
		// Dégâts: (dmg-PA)*loca*RV + cc
		var dmg = sheet.get('dmg_complet_1').value();
		var cc = sheet.get('dmg_complet_2').value();
		var RV = sheet.get('dmg_complet_3').value();
		var PA = [
			{n:'dmg_complet_4A',l:3,t:'Tête',i:1},
			{n:'dmg_complet_4B',l:1,t:'Torse',i:2},
			{n:'dmg_complet_4C',l:0.5,t:'Membre G',i:3},
			{n:'dmg_complet_4D',l:0.5,t:'Membre D',i:4},
			{n:'dmg_complet_4E',l:0.5,t:'Jambe G',i:5},
			{n:'dmg_complet_4F',l:0.5,t:'Jambe D',i:6}
		];

		sheet.get('dmg_complet_L').value('');

		var i = 0;
		var rand = function(){
			var e = PA[i];i += 1;
			var affichage = _('Dommages totaux: ');
			var aff = affichage+e.t;			
			var pa = sheet.get(e.n).value();
			var lejet = Dice.create(dmg).minus(pa).multiply(e.l);
				if(RV!=1){lejet.multiply(RV);}
				if(cc>0){lejet.add(cc);}

			var RB = new RollBuilder(sheet);
				RB.expression(lejet)
				.title(aff)
				.onRoll(function(result){
					var a = result.total;if(a<0){a=0;}
					DomTot(a,e.i);
				})
				.roll();
		}
		var Timer = 0;
			PA.forEach(function(){
				Timer += 1500;
				wait(Timer,rand);
			});

		var som = 0;
		function DomTot(e,f){
			som += Number(e);
			if(f==6){
				var affichage = _('Dommages totaux: ');
				sheet.get('dmg_complet_L').value(affichage+som);
			}
		}
	});
}

function Dommages(sheet,aff,o){
	var c = o.split('+');
		if(c[1]){
			var dice = Dice.create(c[0]).add(c[1]);
		}else{
			c=o.split('-');
			if(c[1]){var dice = Dice.create(c[0]).minus(c[1]);}else{var dice = Dice.create(c[0]);}
		}
	Dice.roll(sheet, dice, aff);
}

function CC(sheet,a,som,loc,aff){	// a = dé, som = ATQ-DEF, loc = localisation, aff = id affichage
	var line = "";
	if(som>=15){	// Mortel
		sheet.get('Dom_5').value(10);
		var crit = Tables.get("critic_list").get('10');
		if(loc==0){
			// Pas de loc
			var e = a;
			if(a==12){e=19;}
			if(a==11){e=20;}
			if(a<=10){e=21;}
			if(a<=8){e=22;}
			if(a<=5){e=23;}
			if(a<=3){e=24;}
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == e){line=attribute};});
		}else if(loc==1){
			// tête
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 20){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 19){line=attribute};});
			}
		}else if(loc==2){
			// torse
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 22){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 21){line=attribute};});
			}
		}else if(loc==3){
			// bras 
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 23){line=attribute};});
			
		}else{
			// jambe
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 24){line=attribute};});
		}
	}else if(som>=13){	// Difficile
		sheet.get('Dom_5').value(8);
		var crit = Tables.get("critic_list").get('8');
		if(loc==0){
			// Pas de loc
			var e = a;
			if(a==12){e=13;}
			if(a==11){e=14;}
			if(a<=10){e=15;}
			if(a<=8){e=16;}
			if(a<=5){e=17;}
			if(a<=3){e=18;}
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == e){line=attribute};});
		}else if(loc==1){
			// tête
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 14){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 13){line=attribute};});
			}
		}else if(loc==2){
			// torse
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 16){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 15){line=attribute};});
			}
		}else if(loc==3){
			// bras 
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 17){line=attribute};});
			
		}else{
			// jambe
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 18){line=attribute};});
		}
	}else if(som>=10){	// Complexe
		sheet.get('Dom_5').value(5);
		var crit = Tables.get("critic_list").get('5');
		if(loc==0){
			// Pas de loc
			var e = a;
			if(a==12){e=7;}
			if(a==11){e=8;}
			if(a<=10){e=9;}
			if(a<=8){e=10;}
			if(a<=5){e=11;}
			if(a<=3){e=12;}
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == e){line=attribute};});
		}else if(loc==1){
			// tête
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 8){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 7){line=attribute};});
			}
		}else if(loc==2){
			// torse
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 10){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 9){line=attribute};});
			}
		}else if(loc==3){
			// bras 
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 11){line=attribute};});
			
		}else{
			// jambe
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 12){line=attribute};});
		}
	}else{	// Simple
		sheet.get('Dom_5').value(3);
		var crit = Tables.get("critic_list").get('3');
		if(loc==0){
			// Pas de loc
			var e = a;
			if(a==12){e=1;}
			if(a==11){e=2;}
			if(a<=10){e=3;}
			if(a<=8){e=4;}
			if(a<=5){e=5;}
			if(a<=3){e=6;}
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == e){line=attribute};});
		}else if(loc==1){
			// tête
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 2){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 1){line=attribute};});
			}
		}else if(loc==2){
			// torse
			if(a<=4){
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 4){line=attribute};});
			}else{
				Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 3){line=attribute};});
			}
		}else if(loc==3){
			// bras 
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 5){line=attribute};});
			
		}else{
			// jambe
			Tables.get("blessure_list").each(function(attribute) {if(attribute.i == 6){line=attribute};});
		}
	}
	var affi = crit.n+": "+line.id;
	sheet.get(aff).text(affi);
}
//endregion

//region------------------- Roll -----------------------------
// Attention! Utiliser text() et non value() pour les labels!
const jet = function(sheet){
	// Caractéristiques
	var list1 = ['INT','REF','DEX','COR','VIT','EMP','TEC','VOL','CHA','VIG','ETOU','COU','SAUT','PS','END','ENC','REC','CON'];
	list1.forEach(function(e){
		sheet.get(e+'_0').on("click", function(){
			var affichage = _('Jet ');
			var aff = affichage+sheet.get(e+'_0').value();
			var b = sheet.get(e+'_3').text();
				if(b==""||b==null){b=0;}
			Roll_P1(sheet,aff,b)
		});	
	});

	// Compétences
	var list2 = [
		{'N':'RUE','V':'INT'},
		{'N':'MON','V':'INT'},
		{'N':'DED','V':'INT'},
		{'N':'EDU','V':'INT'},
		{'N':'ENS','V':'INT'},
		{'N':'ETQ','V':'INT'},
		{'N':'LAN','V':'INT'},
		{'N':'LCO','V':'INT'},
		{'N':'LNA','V':'INT'},
		{'N':'NEG','V':'INT'},
		{'N':'SUR','V':'INT'},
		{'N':'TAC','V':'INT'},
		{'N':'VIGi','V':'INT'},
		{'N':'BAG','V':'REF'},
		{'N':'BAT','V':'REF'},
		{'N':'EQUI','V':'REF'},
		{'N':'ESC','V':'REF'},
		{'N':'ESQ','V':'REF'},
		{'N':'LAM','V':'REF'},
		{'N':'MEL','V':'REF'},
		{'N':'NAV','V':'REF'},
		{'N':'ADR','V':'DEX'},
		{'N':'ARB','V':'DEX'},
		{'N':'ARC','V':'DEX'},
		{'N':'ATH','V':'DEX'},
		{'N':'FUR','V':'DEX'},
		{'N':'PHY','V':'COR'},
		{'N':'RES','V':'COR'},
		{'N':'BEAU','V':'EMP'},
		{'N':'CHAR','V':'EMP'},
		{'N':'COM','V':'EMP'},
		{'N':'DUP','V':'EMP'},
		{'N':'JEU','V':'EMP'},
		{'N':'PER','V':'EMP'},
		{'N':'PSY','V':'EMP'},
		{'N':'REP','V':'EMP'},
		{'N':'SED','V':'EMP'},
		{'N':'STYL','V':'EMP'},
		{'N':'ALC','V':'TEC'},
		{'N':'ART','V':'TEC'},
		{'N':'CONT','V':'TEC'},
		{'N':'CRO','V':'TEC'},
		{'N':'DEG','V':'TEC'},
		{'N':'PIEGE','V':'TEC'},
		{'N':'SOI','V':'TEC'},
		{'N':'COUR','V':'VOL'},
		{'N':'ENV','V':'VOL'},
		{'N':'INC','V':'VOL'},
		{'N':'INTI','V':'VOL'},
		{'N':'RCON','V':'VOL'},
		{'N':'RMAG','V':'VOL'},
		{'N':'RIT','V':'VOL'},
	];
	list2.forEach(function(e){
		sheet.get(e.N+'_0').on("click", function(){
			var affichage = _('Jet ');
			var aff = affichage+sheet.get(e.N+'_0').value();
			var b_1 = sheet.get(e.N+'_3').text();
				if(b_1==""||b_1==null){b_1=0;}
			var b_2 = sheet.get(e.V+'_3').text();
				if(b_2==""||b_2==null){b_2=0;}	
			var b = Number(b_1)+Number(b_2);				
			Roll_P1(sheet,aff,b)
		});	
	});

	function initiative1(){
		var b = sheet.get('REF_3').text();
			if(b==""||b==null){b=0;}
		sheet.prompt('INITIATIVE', 'rollprompt', function(result) { // rollprompt is the id of the view
			var r = result;
			if(r.Mod_prompt){var c = r.Mod_prompt;}else{var c = 0;}
			if(r.Vis_prompt){var v = r.Vis_prompt;}else{var v = 'visible';}
			var lejet = new RollBuilder(sheet);
				lejet.expression('1d10')
				.visibility(v)
				.onRoll(function(result){
					var a = result.values[0];
					Roll_Init(sheet,a,b,c,v);
				})
				.roll();
		});
	}

	sheet.get('initiative_roll').on("click", function(){initiative1()});
	sheet.get('Rapid_init').on("click", function(){initiative1()});

	sheet.get('Rapid_sauv').on("click", function(){
		var aff = Tables.get("trad").get('6').t;
		var b = sheet.get('ETOU_3').text();
			if(b==""||b==null){b=0;}
		Roll_P1(sheet,aff,b)
	});

	var list3 = [{o:'Rapid_com',n:'Rapid_com2',i:'compt_combat'},{o:'Rapid_mag',n:'Rapid_mag2',i:'compt_magic'}];
	list3.forEach(function(e){
		sheet.get(e.o).on("click", function(){
			if(sheet.get(e.n).value() != 0){
				var nb1 = Tables.get(e.i).get(sheet.get(e.n).value());
				var affichage = _('Jet ');
				var aff = affichage+nb1.n;
				var b_1 = sheet.get(nb1.c+'_3').value();
					if(b_1==""||b_1==null){b_1=0;}
				var b_2 = sheet.get(sheet.get(e.n).value()+'_3').value();
					if(b_2==""||b_2==null){b_2=0;}	
				var b = Number(b_1)+Number(b_2);				
				Roll_P1(sheet,aff,b)
			}
		});	
	});

	sheet.get('Rapid_ind').on('click', function(){
		var e = sheet.get('Rapid_ind2').value();
		if(e != 0){
			var line = Tables.get("indices_list").get(e);
			var affichage = _('Dégâts: ');
			var aff = affichage+line.n;
			var a = "1d6";
			var b = sheet.get('INT_3').text();
			if(e == 1 || e == 5){b = sheet.get('TEC_3').text();}
			if(e == 7 || e == 11){b = sheet.get('EMP_3').text();}
			if(e == 5 || e == 7 || e == 8 || e == 10){a="1d10";}
			let dice = Dice.create(a).add(b);
			Dice.roll(sheet, dice, aff);					
		}
	});

	function magie(e){	// 0: sort	1: invocation	2: signe	3: rituel	4: envoutement
		var dat = [
			{'repeater':'magie_sort','component':'knazatua','compt':'INC_3'},
			{'repeater':'magie_invoc','component':'knazatua','compt':'INC_3'},
			{'repeater':'magie_signe','component':'knazatua','compt':'INC_3'},
			{'repeater':'magie_rituel','component':'aqpekwhw','compt':'RIT_3'},
			{'repeater':'magie_env','component':'qyvbwxiq','compt':'ENV_3'},
		];
		let compt = sheet.get(dat[e].repeater).value();
		each(compt, function(entryData, entryIndex) {
			let cptName = dat[e].repeater+'.'+entryIndex+"."+dat[e].component;  // the id of the component you want to change
			let cpt = sheet.get(cptName);
			if(cpt != null){
				cpt.on("click", function(){
					var aff = _('Jet')+': '+sheet.get(dat[e].repeater+'.'+entryIndex+'.'+dat[e].component).text();
					var b1 = sheet.get('VOL_3').text();	// Caractéristique
					var b2 = sheet.get(dat[e].compt).text();	// Compétence
					var b = Number(b1)+Number(b2);
					Roll_P1(sheet,aff,b);
				});
			}else{
				log("Component ["+cptName+"] not found!");
			}
		});
	};
	magie(0);magie(1);magie(2);magie(3);magie(4);
	sheet.get('magie_sort').on('update', function(){magie(0)});
	sheet.get('magie_invoc').on('update', function(){magie(1)});
	sheet.get('magie_signe').on('update', function(){magie(2)});
	sheet.get('magie_rituel').on('update', function(){magie(3)});
	sheet.get('magie_env').on('update', function(){magie(4)});
}

function Roll_P1(sheet,aff,b){
	sheet.prompt(aff, 'rollprompt', function(result) { // rollprompt is the id of the view
		var r = result;
		if(r.Mod_prompt){var c = r.Mod_prompt;}else{var c = 0;}
		if(r.Vis_prompt){var v = r.Vis_prompt;}else{var v = 'visible';}
		var lejet = new RollBuilder(sheet);
		lejet.expression('1d10')
		.visibility(v)
		.onRoll(function(result){
			var a = result.values[0];
			Roll_Cust(sheet,aff,a,b,c,v);
		})
		.roll();
	});
}

function Roll_Cust(sheet,aff,a,b,c,v){
	var dice = Dice.create('5');
		if(a==1){
			dice = Dice.create('-1').minus(Dice.create('1d10').expl(1,10));
			aff += _(" - échec critique!");
		}
		if(a==2){dice = Dice.create('2');}
		if(a==3){dice = Dice.create('3');}
		if(a==4){dice = Dice.create('4');}
		if(a==5){dice = Dice.create('5');}
		if(a==6){dice = Dice.create('6');}
		if(a==7){dice = Dice.create('7');}
		if(a==8){dice = Dice.create('8');}
		if(a==9){dice = Dice.create('9');}
		if(a==10){
			dice = Dice.create('10').add(Dice.create('1d10').expl(10));
			aff += _(" - réussite critique!");
		}
		dice = dice.add(b).add(c);

	Dice.roll(sheet, dice, aff, v);					
}

function Roll_Init(sheet,a,b,c,v){
	var aff = _("Initiative");
	var dice = Dice.create('5');
		if(a==1){
			dice = Dice.create('-1').minus(Dice.create('1d10').expl(1,10));
			aff += _(" - échec critique!");
		}
		if(a==2){dice = Dice.create('2');}
		if(a==3){dice = Dice.create('3');}
		if(a==4){dice = Dice.create('4');}
		if(a==5){dice = Dice.create('5');}
		if(a==6){dice = Dice.create('6');}
		if(a==7){dice = Dice.create('7');}
		if(a==8){dice = Dice.create('8');}
		if(a==9){dice = Dice.create('9');}
		if(a==10){
			dice = Dice.create('10').add(Dice.create('1d10').expl(10));
			aff += _(" - réussite critique!");
		}
		dice = dice.add(b).add(c).tag("initiative");

	Dice.roll(sheet, dice, aff, v);	
}
//endregion

//region------------------- Option -----------------------------
const initOption = function(sheet){
	// Adrénaline
	sheet.get('adre_cor').text(sheet.get('COR_3').text());
	sheet.get('COR_3').on('update', function(){
		sheet.get('adre_cor').text(sheet.get('COR_3').text());
	});

	sheet.get('adre_gen').on('click', function(){
		var lejet = new RollBuilder(sheet);
			lejet.expression('1d6')
			.title(_('Adrénaline'))
			.onRoll(function(result){
				var a = Number(sheet.get('adre_val').value());	// Adrénaline actuelle
				var max = Number(sheet.get('COR_3').text());	// Adrénaline max
				var n = Number(result.total);					// résultat du dé
				var som = Number(a)+Number(n);
				log(n);
				if(som <= max){
					sheet.get('adre_val').value(som);
				}else{
					sheet.get('adre_val').value(max);
				}
			})
			.roll();
	});

	sheet.get('adre_ps').on('click', function(){
		var aff = _('Adrénaline')+': '+_('PS temporaires :heartbeat:');
		var lejet = new RollBuilder(sheet);
			lejet.expression('1d6')
			.title(aff)
			.onRoll(function(result){
				var a = Number(sheet.get('adre_pss').value());	// PS temporaires actuels
				var n = Number(result.total);					// résultat du dé
				var som = Number(a)+Number(n);
					sheet.get('adre_pss').value(som);
			})
			.roll();
	});
	sheet.get('adre_dmg').on('click', function(){
		var aff = _('Adrénaline')+': '+_('Dégâts supplémentaires :hammer:');
		var lejet = new RollBuilder(sheet);
			lejet.expression('1d6')
			.title(aff)
			.roll();
	});

	// Combat verbal
	sheet.get('CV_det').on('click', function(){
		var vol = sheet.get('VOL_3').text();
		var int = sheet.get('INT_3').text();
		var det = Math.floor(((Number(vol)+Number(int))/2)*5);
		sheet.get('CV_de').value(det);
	});

	sheet.get('CV_atq_emp').on('click', function(){
		var a = sheet.get('CV_atq_emp_i').value();
		var aff = _('Attaque Empathique')+': '+Tables.get("atq_emp").get(a).t;
		if(a != 0){
			if(a == 2){
				var dice = Dice.create('1d3');
			}else if(a == 3){
				var dice = Dice.create('1d10');
			}else{
				var dice = Dice.create('1d6');	
			}
			var b = sheet.get('EMP_3').text();
			dice = dice.add(b);
			Dice.roll(sheet, dice, aff);
		}else{
			return;
		}		
	});
	sheet.get('CV_atq_ant').on('click', function(){
		var a = sheet.get('CV_atq_ant_i').value();
		var aff = _('Attaque Antagonique')+': '+Tables.get("atq_ant").get(a).t;
		if(a != 0){
			if(a == 3){
				var dice = Dice.create('1d10');
			}else{
				var dice = Dice.create('1d6');	
			}
			if(a==1){
				var b = sheet.get('INT_3').text();
			}else{
				var b = sheet.get('VOL_3').text();
			}
			dice = dice.add(b);
			Dice.roll(sheet, dice, aff);
		}else{
			return;
		}		
	});
	sheet.get('CV_def').on('click', function(){
		var a = sheet.get('CV_def_i').value();
		var aff = _('Défense')+': '+Tables.get("CV_def").get(a).t;
		if(a != 0){
			if(a == 1){
				var dice = Dice.create('1d10');
				var b = sheet.get('EMP_3').text();
			}else if(a == 3){
				var dice = Dice.create('1d6');
				var b = sheet.get('INT_3').text();
			}else{
				return;
			}
			dice = dice.add(b);
			Dice.roll(sheet, dice, aff);
		}else{
			return;
		}		
	});
}
//endregion

//region---------------------- Fiches secondaires: ---------------------------
const initPNJcc = function(sheet){
	function poingspieds(){
		var poings = CoupPoings(sheet.get('COR_1').value());
		var pieds = CoupPieds(sheet.get('COR_1').value());
		sheet.setData({
			"POINGS_1": poings,
			"PIEDS_1": pieds
		});
	}
	poingspieds();
	sheet.get('COR_1').on('update',function(){poingspieds();});

	// Caractéristiques
	var list1 = ['INT','REF','DEX','COR','VIT','EMP','TEC','VOL','ETOU','COU','SAUT','PS','END','ENC','REC'];
	list1.forEach(function(e){
		sheet.get(e).on("click", function(){
			var affichage = _('Jet ');
			var aff = affichage+sheet.get(e).value();
			var b = sheet.get(e+'_1').value();
				if(b==""||b==null){b=0;}
			Roll_P1(sheet,aff,b)
		});	
	});
	// Compétences
	var list2 = [
			{'N':'RUE','V':'INT'},
			{'N':'MON','V':'INT'},
			{'N':'DED','V':'INT'},
			{'N':'EDU','V':'INT'},
			{'N':'ENS','V':'INT'},
			{'N':'ETQ','V':'INT'},
			{'N':'LAN','V':'INT'},
			{'N':'LCO','V':'INT'},
			{'N':'LNA','V':'INT'},
			{'N':'NEG','V':'INT'},
			{'N':'SUR','V':'INT'},
			{'N':'TAC','V':'INT'},
			{'N':'VIGi','V':'INT'},
			{'N':'BAG','V':'REF'},
			{'N':'BAT','V':'REF'},
			{'N':'EQUI','V':'REF'},
			{'N':'ESC','V':'REF'},
			{'N':'ESQ','V':'REF'},
			{'N':'LAM','V':'REF'},
			{'N':'MEL','V':'REF'},
			{'N':'NAV','V':'REF'},
			{'N':'ADR','V':'DEX'},
			{'N':'ARB','V':'DEX'},
			{'N':'ARC','V':'DEX'},
			{'N':'ATH','V':'DEX'},
			{'N':'FUR','V':'DEX'},
			{'N':'PHY','V':'COR'},
			{'N':'RES','V':'COR'},
			{'N':'BEAU','V':'EMP'},
			{'N':'CHAR','V':'EMP'},
			{'N':'COM','V':'EMP'},
			{'N':'DUP','V':'EMP'},
			{'N':'JEU','V':'EMP'},
			{'N':'PER','V':'EMP'},
			{'N':'PSY','V':'EMP'},
			{'N':'REP','V':'EMP'},
			{'N':'SED','V':'EMP'},
			{'N':'STYL','V':'EMP'},
			{'N':'ALC','V':'TEC'},
			{'N':'ART','V':'TEC'},
			{'N':'CONT','V':'TEC'},
			{'N':'CRO','V':'TEC'},
			{'N':'DEG','V':'TEC'},
			{'N':'PIEGE','V':'TEC'},
			{'N':'SOI','V':'TEC'},
			{'N':'COUR','V':'VOL'},
			{'N':'ENV','V':'VOL'},
			{'N':'INC','V':'VOL'},
			{'N':'INTI','V':'VOL'},
			{'N':'RCON','V':'VOL'},
			{'N':'RMAG','V':'VOL'},
			{'N':'RIT','V':'VOL'},
	];
	list2.forEach(function(e){
		sheet.get(e.N).on("click", function(){
			var affichage = _('Jet ');
			var aff = affichage+sheet.get(e.N).value();
			var b_1 = sheet.get(e.N+'_1').value();
				if(b_1==""||b_1==null){b_1=0;}
			var b_2 = sheet.get(e.V+'_1').value();
				if(b_2==""||b_2==null){b_2=0;}	
			var b = Number(b_1)+Number(b_2);				
			Roll_P1(sheet,aff,b)
		});	
	});

	function initiative(){
		var b = sheet.get('REF_1').value();
			if(b==""||b==null){b=0;}
		sheet.prompt('INITIATIVE', 'rollprompt', function(result) { // rollprompt is the id of the view
			var r = result;
			if(r.Mod_prompt){var c = r.Mod_prompt;}else{var c = 0;}
			if(r.Vis_prompt){var v = r.Vis_prompt;}else{var v = 'visible';}
			var lejet = new RollBuilder(sheet);
				lejet.expression('1d10')
				.visibility(v)
				.onRoll(function(result){
					var a = result.values[0];
					Roll_Init(sheet,a,b,c,v);
				})
				.roll();
		});
	}
	// Initiative
	sheet.get('initiative_roll').on("click", function(){initiative()});
	sheet.get('Rapid_init').on("click", function(){initiative()});

	// Sauvegarde = Etourdissement
	sheet.get('Rapid_sauv').on("click", function(){
		var aff = Tables.get("trad").get('6').t;
		var b = sheet.get('ETOU_3').value();
			if(b==""||b==null){b=0;}
		Roll_P1(sheet,aff,b)
	});

	// Rapid
	var list3 = [{o:'Rapid_com',n:'Rapid_com2',i:'compt_combat'},{o:'Rapid_mag',n:'Rapid_mag2',i:'compt_magic'}];
	list3.forEach(function(e){
		sheet.get(e.o).on("click", function(){
			if(sheet.get(e.n).value() != 0){
				var nb1 = Tables.get(e.i).get(sheet.get(e.n).value());
				var affichage = _('Jet ');
				var aff = affichage+nb1.n;
				var b_1 = sheet.get(nb1.c+'_1').value();
					if(b_1==""||b_1==null){b_1=0;}
				var b_2 = sheet.get(sheet.get(e.n).value()+'_1').value();
					if(b_2==""||b_2==null){b_2=0;}	
				var b = Number(b_1)+Number(b_2);				
				Roll_P1(sheet,aff,b)
			}
		});	
	});
};

const initPNJcombat = function(sheet){
	var arm_t = [];	// table des armes
		
	function initArm(id){	// id = repeater
		arm_t = [];	// reini
		var choice_cac = {};
		var choice_dist = {};
		var choice_dble = {};
		each(sheet.get(id).value(), function (entryData, entryIndex) {	// Armes
			let entry = sheet.get(id).find(entryIndex);
			arm_t.push(entry.value());
			let entry1 = entry.find('pnj_arme_1').value(); // nom
			let entry22 = entry.find('pnj_arme_5').value(); // type
			let line = Tables.get("compt_combat").get(entry22);
				if(line.d == 'cac'){choice_cac[entry1] = entry1;}else{choice_dist[entry1] = entry1;}
			choice_dble[entry1] = entry1;
		});
		try {sheet.get('arm_1').setChoices(choice_cac);} catch (error) {}
		try {sheet.get('arm_2').setChoices(choice_dist);} catch (error) {}
		try {sheet.get('arm_3').setChoices(choice_dble);} catch (error) {}
	};

	initArm('arme_repeater'); // ajout des armes de la fiche
	sheet.get('arme_repeater').on('update', function(){initArm('arme_repeater');});

	sheet.get('ATQ_cac_roll').on('click', function(){	// ATQ CaC
		var arme = sheet.get('arm_1').value();
		var line;
			arm_t.forEach(function(e){
				if(e.pnj_arme_1 == arme){line = e;}
			});
		var pre = line.pnj_arme_6;
		var c = Number(sheet.get('cac_1').value())+Number(sheet.get('cac_2').value())+Number(sheet.get('cac_3').value())+Number(sheet.get('cac_4').value())+Number(pre);

		let line2 = Tables.get("compt_combat").get(line.pnj_arme_5);

		var affichage = _('Jet ');
		var aff = affichage+arme;
			var b_1 = sheet.get(line2.c+'_1').value();
				if(b_1==""||b_1==null){b_1=0;}
			var b_2 = sheet.get(line2.id+'_1').value();
				if(b_2==""||b_2==null){b_2=0;}	
			var b = Number(b_1)+Number(b_2);

		var v = 'visible';
		var lejet = new RollBuilder(sheet);
		lejet.expression('1d10')
		.visibility(v)
		.onRoll(function(result){
			var a = result.values[0];
			Roll_Cust(sheet,aff,a,b,c,v);
		})
		.roll();
	});

	sheet.get('ATQ_dist_roll').on('click', function(){	// ATQ Distance
		var arme = sheet.get('arm_2').value();
		var line;
			arm_t.forEach(function(e){
				if(e.pnj_arme_1 == arme){line = e;}
			});
		var pre = line.pnj_arme_6;
		var c = Number(sheet.get('dist_1').value())+Number(sheet.get('dist_2').value())+Number(sheet.get('dist_3').value())+Number(sheet.get('dist_4').value())+Number(sheet.get('dist_5').value())+Number(pre);

		let line2 = Tables.get("compt_combat").get(line.pnj_arme_5);

		var affichage = _('Jet ');
		var aff = affichage+arme;
			var b_1 = sheet.get(line2.c+'_1').value();
				if(b_1==""||b_1==null){b_1=0;}
			var b_2 = sheet.get(line2.id+'_1').value();
				if(b_2==""||b_2==null){b_2=0;}	
			var b = Number(b_1)+Number(b_2);

		var v = 'visible';
		var lejet = new RollBuilder(sheet);
		lejet.expression('1d10')
		.visibility(v)
		.onRoll(function(result){
			var a = result.values[0];
			Roll_Cust(sheet,aff,a,b,c,v);
		})
		.roll();
	});

	sheet.get('ATQ_calc').on('click', function(){
		var atq = sheet.get('ATQ_calc1').value();
		var loc = sheet.get('ATQ_calc2').value();
			var line0 = Tables.get("loc_list").get(loc);
			var mod = line0.malus;
		var def = sheet.get('ATQ_calc3').value();
		var som = Number(atq)-Number(mod)-Number(def);
			if(som<=0){
				let line = _("Échec de l'attaque!");
				var aff = line+" ("+(Number(atq)-Number(mod))+" VS "+def+")";
			}else{
				let line = _("Réussite de l'attaque!");
				var aff = line+" ("+(Number(atq)-Number(mod))+" VS "+def+")";
				if(som >6){
					// Calcul des CC
					if(loc == 0){	// Pas de visée
						var lejet = new RollBuilder(sheet);
							lejet.expression('2d6')
							.onRoll(function(result){
								var a = result.values[0]+result.values[1];
								CC(sheet,a,som,loc,'ATQ_calc0');
							})
							.roll();
					}else if(loc!=5){	// visée
						if(loc==1||loc==2){
							var lejet = new RollBuilder(sheet);
							lejet.expression('1d6')
							.onRoll(function(result){
								var a = result.values[0];
								CC(sheet,a,som,loc,'ATQ_calc0');
							})
							.roll();
						}else{
							CC(sheet,0,som,loc,'ATQ_calc0');
						}
					}
				}else{
					sheet.get('Dom_5').value(0);
					sheet.get('ATQ_calc0').text('');
				}
			}
		sheet.get('ATQ_calc00').text(aff);
	});

	sheet.get('dommages_roll').on('click', function(){	// Dommages
		// Dégâts: ([(dmg + modCor)*FP]-PA)*loca*RV + cc

		if(sheet.get('Dom_1').value() != null && sheet.get('Dom_1').value() != ''){
			var dmg = sheet.get('Dom_1').value();
			var affichage = _('Dégâts: ');
			var aff = affichage+dmg;
		}else{
			var arme = sheet.get('arm_3').value();
			var affichage = _('Dégâts: ');
			var aff = affichage+arme; var line;
			arm_t.forEach(function(e){
				if(e.pnj_arme_1 == arme){line = e;}
			});
			try {
  				var dmg = line.pnj_arme_2;
			} catch (error) {
				return log(error);	// Fin de la fonction
			}
		}
		var c = dmg.split('+');
			if(c[1]){
				var dice = Dice.create(c[0]).add(c[1]);
			}else{
				c=dmg.split('-');
				if(c[1]){var dice = Dice.create(c[0]).minus(c[1]);}else{var dice = Dice.create(c[0]);}
			}
		if(sheet.get('Dom_3A').value() == true){
			var Cor = Number(sheet.get('COR_1').text());
			var modCor = -4 + (2*(Math.ceil(Cor)/2)-1);
			dice = dice.add(modCor);
		}
		if(sheet.get('Dom_3B').value() == true){
			dice = dice.multiply(2);
		}
		var PA = sheet.get('Dom_7').value();if(PA == null || PA == ''){PA=0;}
			dice = dice.minus(PA);
		if(sheet.get('Dom_2').value()==0){
			// Random loc;
			var Rand = Math.floor(Math.random() * Math.floor(10))+1;
			if(sheet.get('Dom_3B').value() == true){
				if(Rand == '1'){var a = '1';var b = "Tête";}
				if(Rand > '1' && Rand < '6'){var a = '2';var b = "Torse";}
				if(Rand > '5' && Rand < '10'){var a = '3';var b = "Membre gauche";}
				if(Rand == '10'){var a = '4';var b = "Queue ou Aile";}
			}
			else{
				if(Rand == '1'){var a = '1';var b = "Tête";}
				if(Rand > '1' && Rand < '5'){var a = '2';var b = "Torse";}
				if(Rand == '5'){var a = '3';var b = "Bras droit";}
				if(Rand == '6'){var a = '3';var b = "Bras gauche";}
				if(Rand > '6'){var a = '4';var b = "Jambe";}
			}
			var loca_line = Tables.get("loc_list").get(a);
			aff += " ("+loca_line.loc+")";
			var loca = Number(loca_line.mult);
		}else{
			var loca_line = Tables.get("loc_list").get(sheet.get('Dom_2').value());
			aff += " ("+loca_line.loc+")";
			var loca = Number(loca_line.mult);
		}
		dice = dice.multiply(loca);
		var RV = Number(sheet.get('Dom_6').value());
			if(RV!=1){dice = dice.multiply(RV);}
		var cc = Number(sheet.get('Dom_5').value());
			if(cc>0){dice.add(cc);}
		
		Dice.roll(sheet, dice, aff);
	});

	sheet.get('dmg_complet_roll').on('click',function(){
		// Dégâts: (dmg-PA)*loca*RV + cc
		var dmg = sheet.get('dmg_complet_1').value();
		var cc = sheet.get('dmg_complet_2').value();
		var RV = sheet.get('dmg_complet_3').value();
		var PA = [
			{n:'dmg_complet_4A',l:3,t:'Tête',i:1},
			{n:'dmg_complet_4B',l:1,t:'Torse',i:2},
			{n:'dmg_complet_4C',l:0.5,t:'Membre G',i:3},
			{n:'dmg_complet_4D',l:0.5,t:'Membre D',i:4},
			{n:'dmg_complet_4E',l:0.5,t:'Jambe G',i:5},
			{n:'dmg_complet_4F',l:0.5,t:'Jambe D',i:6}
		];

		sheet.get('dmg_complet_aff').value('');

		var i = 0;
		var rand = function(){
			var e = PA[i];i += 1;
			var affichage = _('Dommages totaux: ');
			var aff = affichage+e.t;			
			var pa = sheet.get(e.n).value();
			var lejet = Dice.create(dmg).minus(pa).multiply(e.l);
				if(RV!=1){lejet.multiply(RV);}
				if(cc>0){lejet.add(cc);}

			var RB = new RollBuilder(sheet);
				RB.expression(lejet)
				.title(aff)
				.onRoll(function(result){
					var a = result.total;if(a<0){a=0;}
					DomTot(a,e.i);
				})
				.roll();
		}
		var Timer = 0;
			PA.forEach(function(){
				Timer += 1500;
				wait(Timer,rand);
			});

		var som = 0;
		function DomTot(e,f){
			som += Number(e);
			if(f==6){
				var affichage = _('Dommages totaux: ');
				sheet.get('dmg_complet_aff').value(affichage+som);
			}
		}
	});
};

const initPNJJauges = function(sheet){
	// Jauges
	var list4 = [
		{"N":"ps_max","V":"PS"},
		{"N":"end_max","V":"END"},
	];
	list4.forEach(function(e){
		sheet.get(e.N).value(sheet.get(e.V+'_1').value());
		sheet.get(e.V+'_1').on('update', function(){
			sheet.get(e.N).value(sheet.get(e.V+'_1').value());
		});
	});

  let a = ['ps','end']; // liste des id des jauges
  a.forEach(function(i){
  	JaugesPnJ(sheet,i,100,10);
    JaugesPlusetMoins(sheet,i,100,10);
	sheet.get(i+'_value').on("update", function(){JaugesPnJ(sheet,i,100,10);});
  });
};

const JaugesPnJ = function(sheet,idjauge,echelle,pas){
	let TabClass = [];	
	TabClass['ps'] = 'bg-danger';	TabClass['end'] = 'bg-success';	
	let max = Number(sheet.get(idjauge+'_max').value());
	let current = Number(sheet.get(idjauge+'_value').value());
	let niveau = echelle * current / max;
	for(let i = 0 ; i < echelle+pas ; i+=pas){
		if( niveau == 0 ){sheet.get('jauge_'+idjauge+'_'+i).removeClass(TabClass[idjauge]);};
		if( niveau < i ){sheet.get('jauge_'+idjauge+'_'+i).removeClass(TabClass[idjauge]);}
		else{sheet.get('jauge_'+idjauge+'_'+i).addClass(TabClass[idjauge]);};
	};

};
//endregion

//---------------------- INIT Monster ---------------------------
const initMonster = function(sheet) {
	initPNJcc(sheet);
	initPNJcombat(sheet);
	initPNJJauges(sheet);
	log('fin de l\'initiation!');
};

//---------------------- INIT PNJ ---------------------------
const initPnj = function(sheet) {
	initPNJcc(sheet);
	initPNJcombat(sheet);
	initPNJJauges(sheet);
	PnJadd(sheet);
	log('fin de l\'initiation!');
};

function PnJadd(sheet){
	var Data = [
		{ N:'Forgeron', Armure:'Aucune', Butin: "Dague, Objet communs (1d6), Couronnes (3d6)" },
		{ N:'Alchimiste', Armure:'Aucune', Butin: "Dague, Objet communs (1d6), Couronnes (3d6)" },
		{ N:'Baladin', Armure:'Aucune', Butin: "Objet communs (1d6), Couronnes (3d6)" },
		{ N:'Voleur', Armure:'Aucune', Butin: "Stylet, Outils de voleurs, Poches secrètes x2, Objet communs (2d6), Couronnes (3d6)" },
		{ N:'Voyous', Armure:'Aucune', Butin: "Masse, Stylet, Outils de voleurs, Objet communs (2d6), Couronnes (3d6)" },
		{ N:'Charlatans', Armure:'Aucune', Butin: "Stylet, Matériel de contrefaçon, Outils de voleurs, Objet communs (2d6), Couronnes (3d6)" },
		{ N:'Journalier', Armure:'Aucune', Butin: "Hachette, Objet communs (1d6), Couronnes (1d6)"},
		{ N:'Marchand', Armure:'Aucune', Butin: "Dague, Objet communs (1d10), Couronnes (4d6)"},
		{ N:'Savant', Armure:'Aucune', Butin: "Objet communs (1d6), Couronnes (2d10)"},
		{ N:'Aubergiste', Armure:'3', Butin: "Stylet, Objet communs (1d6), Couronnes (1d10)"},
		{ N:'Docteur', Armure:'Aucune', Butin: "Scalpel, Intruments chirurgicaux, Objet communs (1d6), Couronnes (1d10)"},
	];
	var Caract = [
		{INT_1:4,REF_1:3,DEX_1:4,COR_1:5,VIT_1:2,EMP_1:3,TEC_1:6,VOL_1:3},
		{INT_1:4,REF_1:3,DEX_1:4,COR_1:5,VIT_1:2,EMP_1:3,TEC_1:6,VOL_1:3},
		{INT_1:4,REF_1:3,DEX_1:4,COR_1:2,VIT_1:4,EMP_1:7,TEC_1:2,VOL_1:4},
		{INT_1:3,REF_1:6,DEX_1:5,COR_1:3,VIT_1:5,EMP_1:2,TEC_1:3,VOL_1:3},
		{INT_1:3,REF_1:6,DEX_1:5,COR_1:3,VIT_1:5,EMP_1:2,TEC_1:3,VOL_1:3},
		{INT_1:3,REF_1:6,DEX_1:5,COR_1:3,VIT_1:5,EMP_1:2,TEC_1:3,VOL_1:3},
		{INT_1:3,REF_1:4,DEX_1:4,COR_1:6,VIT_1:3,EMP_1:3,TEC_1:3,VOL_1:4},
		{INT_1:6,REF_1:2,DEX_1:3,COR_1:2,VIT_1:3,EMP_1:6,TEC_1:3,VOL_1:5},
		{INT_1:8,REF_1:2,DEX_1:2,COR_1:2,VIT_1:2,EMP_1:4,TEC_1:5,VOL_1:5},
		{INT_1:6,REF_1:5,DEX_1:3,COR_1:5,VIT_1:4,EMP_1:6,TEC_1:4,VOL_1:6},
		{INT_1:7,REF_1:4,DEX_1:6,COR_1:5,VIT_1:4,EMP_1:7,TEC_1:5,VOL_1:6},
	];
	var Compt = [
		{ART_1:15, BAG_1:6, COUR_1:5, NEG_1:5, PER_1:5, PHY_1:9, RES_1:10, RCON_1:6, SUR_1:7},
		{ALC_1:15, BAG_1:6, COUR_1:5, NEG_1:5, PER_1:5, PHY_1:9, RES_1:10, RCON_1:6, SUR_1:7},
		{BEAU_1:13, CHAR_1:12, RUE_1:7, DUP_1:11, ETQ_1:8, PER_1:10, PSY_1:10, REP_1:13, SED_1:12},
		{ADR_1:12, ATH_1:11, RUE_1:6, CRO_1:10, DUP_1:5, FUR_1:12, INTI_1:7, LAM_1:12, VIGi_1:6},
		{ADR_1:9, ATH_1:11, RUE_1:6, CRO_1:10, DUP_1:5, FUR_1:12, INTI_1:7, LAM_1:12, VIGi_1:6, MEL_1:5},
		{ADR_1:9, ATH_1:11, RUE_1:6, CRO_1:10, DUP_1:5, FUR_1:12, INTI_1:7, LAM_1:12, VIGi_1:6, CONTR_1:5},
		{ATH_1:12, BAG_1:8, COUR_1:7, EQUI_1:5, INTI_1:6, PHY_1:14, RES_1:12, RCON_1:7, SUR_1:6, VIGi_1:7},
		{CHAR_1:9, RUE_1:10, EDU_1:11, JEU_1:9, NEG_1:13, PER_1:11, PSY_1:8, RCON_1:11, LCO_1:8},
		{ALC_1:6, DED_1:13, EDU_1:16, ENS_1:14, ETQ_1:11, LCO_1:10, RCON_1:11, SUR_1:12, TAC_1:10, VIGi_1:10},
		{RUE_1:6, INTI_1:4,LCO_1:3,NEG_1:7,BAG_1:4,CHAR_1:5,JEU_1:7,PER_1:5,PSY_1:4,RCON_1:6},
		{DED_1:5, NEG_1:3, SOI_1:10, SUR_1:5, LAM_1:4, CHAR_1:5, ETQ_1:4, ALC_1:5, PSY_1:6, RCON_1:4},
	];
	var DT2 = {};
	var i=0;
	Data.forEach(function(e){
		DT2[i]=e.N;
		i += 1;
	});
	sheet.get('preset_pnj_1').setChoices(DT2);
	sheet.get('preset_pnj').on('click', function(){
		var index = sheet.get('preset_pnj_1').value();
		var a = sheet.setData(Data[index]);
		var b = sheet.setData(Caract[index]);
		var c = sheet.setData(Compt[index]);
		a;wait(1000,b);wait(2000,c);
	});
}

//---------------------- INIT MK ---------------------------
const initMJ = function(sheet) {
	sheet.get('MJ_dist2').on('update', function(){
		var a = sheet.get('MJ_dist1').value(); // echelle
  		var b = sheet.get('MJ_dist2').value(); // distance
  		var km = Number(a)*Number(b);
		var affichage = _('Distance en km: ');
  		var aff = affichage+km.toFixed(1);		  
  		sheet.get('MJ_dist_aff').value(aff);
		  KtoT(km,sheet);
	});
	log('fin de l\'initiation!');
};

function KtoT(km,sheet){
    var pied =	Number(km)/20;// 20km par jour
    var piedE = Math.round((Number(pied) - Number(Math.floor(pied)))*24);
    var cheval = Number(km)/40;	// 40km par jour
    var chevalE = Math.round((Number(cheval) - Number(Math.floor(cheval)))*24);
    var chevalL = Number(km)/65;	// 65km par jour : charge légère
    var chevalEL = Math.round((Number(chevalL) - Number(Math.floor(chevalL)))*24);
    
    var boeuf =	Number(km)/15;//
    var boeufE = Math.round((Number(boeuf) - Number(Math.floor(boeuf)))*24);
    var caravane =	Number(km)/30;// 30km par jour
    var caravaneE = Math.round((Number(caravane) - Number(Math.floor(caravane)))*24);		
    var caleche =	Number(km)/35;// 35km par jour
    var calecheE = Math.round((Number(caleche) - Number(Math.floor(caleche)))*24);

    var eau_douce =	Number(km)/50;// 50km par jour
    var eau_douceE = Math.round((Number(eau_douce) - Number(Math.floor(eau_douce)))*24);
    var haute_mer =	Number(km)/100;// 100km par jour
    var haute_merE = Math.round((Number(haute_mer) - Number(Math.floor(haute_mer)))*24);

	var Texte = [_(' jour(s) et '),_(' heure(s).')];
	var TN = {
		b: _('Bœuf'),
		p: _('A pied'),
		cc: _('Caravane | Chariot'),
		c: _('A cheval'),
		cm: _('charge modérée'),
		ca: _('Calèche'),
		cl: _('charge légère'),
	};
	var NN = {
		ed: _('En eau douce'),
		hm: _('En haute mer')
	};

        var terrestre = [TN.b+": "+Math.floor(boeuf)+Texte[0]+boeufE+Texte[1],TN.p+": "+Math.floor(pied)+Texte[0]+piedE+Texte[1],TN.cc+": "+Math.floor(caravane)+Texte[0]+caravaneE+Texte[1],TN.c+" ("+TN.cm+"): "+Math.floor(cheval)+Texte[0]+chevalE+Texte[1],TN.ca+": "+Math.floor(caleche)+Texte[0]+calecheE+Texte[1],TN.c+" ("+TN.cl+"): "+Math.floor(chevalL)+Texte[0]+chevalEL+Texte[1]];
        var navigation = [NN.ed+": "+Math.floor(eau_douce)+Texte[0]+eau_douceE+Texte[1],NN.hm+": "+Math.floor(haute_mer)+Texte[0]+haute_merE+Texte[1]];

	sheet.get('MJ_dist_T').value(_('Terrestre')+':\n'+terrestre[0]+'\n'+terrestre[1]+'\n'+terrestre[2]+'\n'+terrestre[3]+'\n'+terrestre[4]+'\n'+terrestre[5]);
	sheet.get('MJ_dist_N').value(_('Navigation')+':\n'+navigation[0]+'\n'+navigation[1]);
}