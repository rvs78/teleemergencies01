/* Codi 3 · Parla com el SEM — contingut didàctic
   Font única: «CODI 3 MODIFICAT. Codificacions de transmissió de dades pels recursos SEM»
   (U100.U00.0.D6.008, v1, 23/09/2021) i guions de la pràctica de radiocomunicació (Bravo 727/749). */
window.DATA = (function () {

  /* ---------- CODI 3 (versió modificada) ---------- */
  const CODES = [
    ['3.0', 'Aturada cardiorespiratòria', 'acr', true],
    ['3.01', 'Aturada cardiorespiratòria recuperada', 'acr'],
    ['3.02', 'Aturada cardiorespiratòria no recuperada', 'acr'],
    ['3.03', 'ACR perllongada. Activació del Protocol de Cor Aturat', 'acr'],
    ['3.05', 'ACR amb criteris de RCP extracorpòria', 'acr'],
    ['3.8', 'Èxitus', 'acr'],
    ['3.1', 'Trucada telefònica', 'com'],
    ['3.1 O', 'Trucada telefònica operativa', 'com'],
    ['3.1 S', 'Trucada telefònica sanitària', 'com'],
    ['3.1 M', 'Trucada telefònica de suport mèdic des de CECOS', 'com'],
    ['3.1 E', 'Trucada a 3 amb CECOS i ECO', 'com'],
    ['3.1 MC', 'Trucada a metge de CECOS de crítics adult / pediàtric', 'com'],
    ['3.2', 'Recurs no operatiu per descans', 'rec'],
    ['3.3', 'Recurs operatiu', 'rec'],
    ['3.4', 'Arribada al lloc de l’incident', 'srv'],
    ['3.5', 'Informació de la situació o dades de l’afectat', 'srv'],
    ['3.6', 'Finalització del servei. La unitat es troba operativa', 'rec'],
    ['3.7', 'Es precisa ajut policial', 'aju'],
    ['3.7 GU/PL', 'Es precisa ajut policial: Guàrdia Urbana / Policia local', 'aju'],
    ['3.7 ME', 'Es precisa ajut policial: Mossos d’Esquadra', 'aju'],
    ['3.70', 'Es precisa ajut policial URGENT. Situació de risc físic', 'aju', true],
    ['3.9', 'Recurs no operatiu per accident', 'rec'],
    ['3.9 F', 'Recurs no operatiu per accident amb personal assistencial lesionat', 'rec', true],
    ['3.10', 'Retorn a base', 'rec'],
    ['3.11', 'Anul·lació del servei', 'srv'],
    ['3.13', 'Fer ús correcte de l’equip de ràdio', 'com'],
    ['3.14', 'Es precisa ajut d’una altra unitat (s’especificarà el tipus)', 'aju'],
    ['3.15', 'Relleu de l’equip assistencial', 'rec'],
    ['3.16', 'Recurs no operatiu per reposar combustible', 'rec'],
    ['3.17', 'Recurs no operatiu per reposar material sanitari', 'rec'],
    ['3.18', 'Es precisa ajut de Bombers', 'aju'],
    ['3.19', 'Es precisa una unitat de transport sanitari (USVB)', 'aju'],
    ['3.20', 'Resteu atents en espera de noves dades o informació', 'com'],
    ['3.21', 'Donar coordenades de situació o localització de la unitat', 'srv'],
    ['3.22 M', 'Alta mèdica', 'pac'],
    ['3.22', 'Alta voluntària / Rebuig de l’assistència', 'pac'],
    ['3.23', 'Accident de trànsit', 'pac'],
    ['3.24', 'Indigent / Sociopatia', 'pac'],
    ['3.25', 'Intoxicació enòlica', 'pac'],
    ['3.26', 'Sobredosi per drogues', 'pac'],
    ['3.28', 'Pacient amb patologia psiquiàtrica. Es troba agitat', 'pac'],
    ['3.29', 'Caiguda / Trauma a via pública / domicili', 'pac'],
    ['3.30', 'IAM / Angor', 'pac'],
    ['3.31', 'Intent d’autòlisi', 'pac'],
    ['3.32', 'Pacient inconscient', 'pac'],
    ['3.33', 'Pacient amb dispnea aguda', 'pac'],
    ['3.34', 'Pacient intoxicat. Exposició potencial a tòxics de risc per als assistencials', 'pac', true],
    ['3.35', 'Mobilització', 'srv'],
    ['3.40', 'Silenci a la xarxa, comunicat d’emergència', 'com', true],
    ['3.43', 'Arribada de la unitat a punt de trobada segur', 'srv'],
    ['3.50', 'Indiqueu el temps estimat per arribar al lloc de l’incident', 'srv'],
    ['3.51', 'Trasllat assistit per metge / infermer', 'srv'],
    ['3.52', 'Trasllat no assistit per metge / infermer', 'srv'],
    ['3.53', 'Unitat assistint i operativa per a noves necessitats de servei', 'rec'],
    ['3.54', 'Unitat operativa, cobrint zona fora de la base habitual', 'rec'],
    ['3.60', 'La unitat sol·licita temps de disposició lliure', 'rec'],
    ['3.62', 'Unitat finalitza servei i resta inoperativa temporalment per contingut d’alt impacte emocional', 'rec'],
    ['3.71', 'Incident amb possible afectat per violència sexual', 'pac', true],
    ['3.73', 'Punt de seguretat indicat per CECOS. Trobada amb cossos policials', 'aju'],
    ['3.78', 'S’informa les unitats d’activació per incident IMV', 'com'],
    ['3.79', 'S’informa les unitats per incident IMVi', 'com'],
  ].map(([code, text, fam, prio]) => ({ code, text, fam, prio: !!prio }));

  const FAMILIES = {
    acr: { name: 'Aturada i èxitus', hint: 'Què ha passat amb el cor del pacient?', icon: 'heart' },
    rec: { name: 'Estat del recurs', hint: 'Està operativa la unitat? Per què no?', icon: 'truck' },
    srv: { name: 'Fases del servei', hint: 'En quin moment del servei som?', icon: 'route' },
    aju: { name: 'Demanda d’ajuda', hint: 'Qui ha de venir a ajudar?', icon: 'siren' },
    pac: { name: 'Tipus de pacient o incident', hint: 'Què li passa al pacient?', icon: 'user' },
    com: { name: 'Comunicació i xarxa', hint: 'Com ens comuniquem?', icon: 'radio' },
  };

  /* ---------- INTERCO ---------- */
  const INTERCO = [
    ['A', 'Alfa', 'Alfa'], ['B', 'Bravo', 'Bravo'], ['C', 'Charlie', 'Charli'], ['D', 'Delta', 'Delta'],
    ['E', 'Echo', 'Eko'], ['F', 'Foxtrot', 'Foxtrot'], ['G', 'Golf', 'Golf'], ['H', 'Hotel', 'Jotel'],
    ['I', 'India', 'India'], ['J', 'Juliett', 'Yuliet'], ['K', 'Kilo', 'Kilo'], ['L', 'Lima', 'Lima'],
    ['M', 'Mike', 'Maik'], ['N', 'November', 'Nouvember'], ['Ñ', 'Ñoño', 'Ñoño'], ['O', 'Oscar', 'Oscar'],
    ['P', 'Papa', 'Papa'], ['Q', 'Quebec', 'Kebek'], ['R', 'Romeo', 'Romeo'], ['S', 'Sierra', 'Sierra'],
    ['T', 'Tango', 'Tango'], ['U', 'Uniform', 'Iuniform'], ['V', 'Víctor', 'Víctor'], ['W', 'Whisky', 'Uiski'],
    ['X', 'X-Ray', 'Eksrey'], ['Y', 'Yankee', 'Yanki'], ['Z', 'Zulú', 'Zulú'],
  ].map(([l, w, p]) => ({ l, w, p }));

  /* Fase 1 · A: lletreja (arrossega paraules INTERCO en ordre) */
  const SPELL = [
    { word: 'SOLER', ctx: 'Cognom de l’alertant' },
    { word: 'PUIG', ctx: 'Cognom del pacient' },
    { word: 'B727', ctx: 'Indicatiu de la unitat' },
    { word: 'GAUDÍ', ctx: 'Nom del carrer (Av. de Gaudí)', strip: true },
    { word: 'KTP', ctx: 'Lletres de la matrícula 4521 KTP' },
    { word: 'NÚRIA', ctx: 'Nom de la filla que ha trucat', strip: true },
  ];
  /* Fase 1 · B: escolta i escriu */
  const LISTEN = [
    { id: 'l1', answer: 'VALL', say: 'Víctor. Alfa. Lima. Lima.' },
    { id: 'l2', answer: 'HOSPITAL', say: 'Hotel. Oscar. Sierra. Papa. India. Tango. Alfa. Lima.' },
    { id: 'l3', answer: 'MAR', say: 'Mike. Alfa. Romeo.' },
    { id: 'l4', answer: 'B749', say: 'Bravo. Set. Quatre. Nou.' },
  ];

  /* ---------- Fase 3 · Escenes il·lustrades ----------
     img: assets/img/<id>.webp · prompt: escena per a Seedream (anglès)
     desc: el que llegeix l'alumnat · opts: 3 distractors plausibles */
  const SCENES = [
    { id: 's3-29', code: '3.29', lvl: 1, desc: 'Un home de 78 anys ha caigut a la vorera del carrer Gran de Sant Andreu i es queixa del canell.', opts: ['3.32', '3.23', '3.24'],
      prompt: 'an elderly man sitting on the pavement after a fall, holding his wrist, a passer-by kneeling beside him, the two technicians walking towards him from an ambulance parked at the corner' },
    { id: 's3-23', code: '3.23', lvl: 1, desc: 'Col·lisió entre un camió de repartiment i un turisme a la Ronda de Dalt, a l’alçada de l’hospital.', opts: ['3.29', '3.9', '3.18'],
      prompt: 'minor traffic collision between a delivery truck and a small car on a wide urban ring road with a hospital building in the background, hazard triangles on the road, the two technicians approaching the car carrying a medical bag' },
    { id: 's3-0', code: '3.0', lvl: 1, desc: 'Al centre comercial, un home de 55 anys no respon i no respira. L’equip inicia compressions i col·loca el DEA.', opts: ['3.32', '3.01', '3.8'],
      prompt: 'inside a shopping centre, a man lying on the floor, one technician performing chest compressions with straight arms while the other places the pads of an automated external defibrillator, a small crowd kept at a distance' },
    { id: 's3-01', code: '3.01', lvl: 2, desc: 'Després de dues descàrregues del DEA, el pacient torna a tenir pols i respira. Cal comunicar-ho a CECOS.', opts: ['3.0', '3.02', '3.03'],
      prompt: 'a man lying on the floor of a sports hall breathing with an oxygen mask, the two technicians kneeling beside him looking relieved, one checking the pulse at the neck, defibrillator open next to them' },
    { id: 's3-30', code: '3.30', lvl: 1, desc: 'Una dona de 62 anys té dolor opressiu al pit que li baixa pel braç esquerre, suada i pàl·lida.', opts: ['3.33', '3.0', '3.32'],
      prompt: 'a pale woman in her sixties sitting on a sofa in her living room pressing her hand against her chest, sweating, one technician kneeling and attaching ECG electrodes while the other prepares a stretcher' },
    { id: 's3-33', code: '3.33', lvl: 1, desc: 'Un home amb antecedents respiratoris no pot parlar seguit perquè li falta molt l’aire.', opts: ['3.30', '3.32', '3.34'],
      prompt: 'a man sitting upright leaning forward with hands on his knees struggling to breathe in a kitchen, one technician placing an oxygen mask on him, pulse oximeter on his finger' },
    { id: 's3-32', code: '3.32', lvl: 1, desc: 'Un jove està estirat a terra al parc. Respira, però no respon quan li parlen ni quan el toquen.', opts: ['3.0', '3.25', '3.29'],
      prompt: 'a young man lying on his side in the recovery position on the grass of a city park, breathing, one technician kneeling and checking his airway, the other talking on a portable radio' },
    { id: 's3-25', code: '3.25', lvl: 2, desc: 'Festa major de Gràcia, 2 h de la matinada: una noia ha begut molt alcohol, vomita i gairebé no s’aguanta dreta.', opts: ['3.26', '3.32', '3.34'],
      prompt: 'night street festival with colourful paper decorations, a young woman sitting on a bench looking dizzy holding a plastic bottle of water, friends around her, the technicians assessing her calmly' },
    { id: 's3-26', code: '3.26', lvl: 3, desc: 'Al lavabo d’un local, un home respira molt lentament. Al costat hi ha una xeringa i els amics diuen que ha consumit drogues.', opts: ['3.25', '3.34', '3.32'],
      prompt: 'small public restroom, a man sitting on the floor against the wall with very slow breathing and pinpoint pupils, a capped syringe on the floor at a distance, one technician supporting his head and ventilating with a bag valve mask' },
    { id: 's3-28', code: '3.28', lvl: 2, desc: 'Un home amb antecedents de salut mental crida, camina sense parar pel pis i diu que algú el persegueix.', opts: ['3.24', '3.70', '3.25'],
      prompt: 'a distressed man pacing and shouting in an apartment hallway, a family member standing back worried, the two technicians keeping a safe distance with open calm body language' },
    { id: 's3-24', code: '3.24', lvl: 2, desc: 'Un home sense llar dorm al caixer d’una sucursal bancària. Té fred i porta dies sense menjar bé.', opts: ['3.25', '3.28', '3.32'],
      prompt: 'night, a homeless man with a blanket and shopping trolley sitting inside a bank cash machine lobby, the technicians crouching to talk to him and offering a thermal blanket' },
    { id: 's3-34', code: '3.34', lvl: 3, desc: 'En un magatzem industrial, dos treballadors s’han marejat després d’una fuita d’un producte químic. Fa una olor forta.', opts: ['3.25', '3.18', '3.33'],
      prompt: 'industrial warehouse with chemical drums and a yellow puddle on the floor, two workers sitting outside the open door looking dizzy, the technicians wearing protective masks and keeping the ambulance upwind' },
    { id: 's3-18', code: '3.18', lvl: 2, desc: 'Un cotxe ha bolcat a la carretera i la conductora està atrapada dins: cal excarcerar-la.', opts: ['3.23', '3.14', '3.7'],
      prompt: 'a car overturned on its side on a road at the edge of the city, a woman trapped inside the car, the technicians beside the window talking to her, a fire engine arriving in the distance' },
    { id: 's3-70', code: '3.70', lvl: 3, desc: 'Mentre atenen un ferit al carrer, un grup comença a amenaçar l’equip i un home s’hi acosta amb actitud violenta.', opts: ['3.7', '3.7 ME', '3.28'],
      prompt: 'tense night street scene, the two technicians stepping back behind their ambulance raising a hand to talk on the radio, an aggressive man in the foreground shouting with clenched fists, no weapons' },
    { id: 's3-7me', code: '3.7 ME', lvl: 3, desc: 'Baralla acabada en un bar: la situació està calmada però cal que vinguin els Mossos d’Esquadra per fer l’atestat.', opts: ['3.70', '3.7 GU/PL', '3.18'],
      prompt: 'outside a bar at night, a man sitting on a chair holding gauze on his eyebrow, broken glass swept aside, a technician treating him calmly while the other speaks on the radio, police car lights approaching in the distance' },
    { id: 's3-43', code: '3.43', lvl: 3, desc: 'CECOS ha indicat un punt de seguretat a dues cantonades de l’incident. L’ambulància hi arriba i espera els cossos policials.', opts: ['3.4', '3.73', '3.10'],
      prompt: 'ambulance parked and waiting at a quiet street corner, the two technicians inside the cab looking towards a distant street, a police van arriving and parking next to them' },
    { id: 's3-4', code: '3.4', lvl: 1, desc: 'L’ambulància s’atura davant del portal de l’adreça del servei. L’equip baixa amb la motxilla.', opts: ['3.43', '3.6', '3.35'],
      prompt: 'ambulance just stopped in front of a residential building entrance with emergency lights on, the two technicians stepping out carrying a medical backpack and a portable defibrillator' },
    { id: 's3-35', code: '3.35', lvl: 2, desc: 'L’equip ha rebut el servei: s’asseu, es posa el cinturó i surt de la base cap a l’adreça.', opts: ['3.4', '3.3', '3.50'],
      prompt: 'ambulance leaving the garage of an ambulance base with emergency lights turning on, the two technicians in the front seats fastening their seatbelts' },
    { id: 's3-3', code: '3.3', lvl: 1, desc: 'Inici de guàrdia: l’equip ha revisat el vehicle i el material. Comuniquen a CECOS que estan disponibles.', opts: ['3.6', '3.35', '3.53'],
      prompt: 'morning at an ambulance base, the two technicians checking equipment in the open back of the ambulance with a checklist, coffee cups on a bench, one holding a portable radio' },
    { id: 's3-2', code: '3.2', lvl: 2, desc: 'Torn de dinar a la base: la unitat no està operativa durant el descans pactat.', opts: ['3.60', '3.10', '3.3'],
      prompt: 'the two technicians eating lunch at a table in the small rest room of an ambulance base, ambulance visible through a window, relaxed atmosphere' },
    { id: 's3-6', code: '3.6', lvl: 2, desc: 'El pacient ja és a urgències de l’hospital. L’equip ha netejat la llitera i torna a estar disponible.', opts: ['3.10', '3.3', '3.53'],
      prompt: 'ambulance bay outside a hospital emergency department, the two technicians wiping down a clean empty stretcher and closing the back doors of the ambulance' },
    { id: 's3-10', code: '3.10', lvl: 2, desc: 'Ja disponibles després del servei, CECOS els indica que tornin a la seva base habitual.', opts: ['3.6', '3.54', '3.35'],
      prompt: 'ambulance driving calmly without emergency lights along a city avenue at sunset towards an ambulance base building, the two technicians in the cab' },
    { id: 's3-16', code: '3.16', lvl: 2, desc: 'El dipòsit està a la reserva: l’ambulància para a la gasolinera i no pot rebre serveis durant uns minuts.', opts: ['3.17', '3.9', '3.2'],
      prompt: 'ambulance stopped at a petrol station pump, one technician refuelling with the nozzle, the other checking the tyres' },
    { id: 's3-17', code: '3.17', lvl: 2, desc: 'Després d’un servei llarg s’han gastat apòsits, guants i oxigen: cal reposar-ho al magatzem.', opts: ['3.16', '3.6', '3.60'],
      prompt: 'storage room of an ambulance base with shelves of medical supplies, the two technicians refilling the ambulance bags with gloves, dressings and an oxygen cylinder' },
    { id: 's3-9', code: '3.9', lvl: 3, desc: 'Un turisme ha xocat per darrere amb l’ambulància en un semàfor. L’equip està bé, però el vehicle no pot circular.', opts: ['3.9 F', '3.23', '3.16'],
      prompt: 'small rear-end collision at a traffic light, a car with a dented bumper touching the back of an ambulance, the two technicians standing unhurt next to it exchanging papers with the driver' },
    { id: 's3-19', code: '3.19', lvl: 3, desc: 'L’equip de suport avançat estabilitza el pacient i demana una unitat de transport sanitari per fer el trasllat.', opts: ['3.14', '3.52', '3.51'],
      prompt: 'a doctor in a plain white coat and a nurse in a plain navy jacket without any emblem treating a stable patient sitting on a chair, one of the two technicians speaking on the portable radio, a second ambulance arriving through the door' },
    { id: 's3-51', code: '3.51', lvl: 3, desc: 'El pacient és crític: viatja a l’hospital acompanyat per la metgessa dins de l’ambulància.', opts: ['3.52', '3.19', '3.6'],
      prompt: 'inside the back of a moving ambulance, a female doctor monitoring a patient on the stretcher with a cardiac monitor, one technician assisting with an infusion bag' },
    { id: 's3-22', code: '3.22', lvl: 3, desc: 'Després de valorar-lo, el pacient no vol anar a l’hospital i signa el document de rebuig de l’assistència.', opts: ['3.22 M', '3.11', '3.6'],
      prompt: 'an adult man sitting at his kitchen table signing a paper form on a clipboard held by one technician, the other technician packing the medical bag' },
    { id: 's3-15', code: '3.15', lvl: 3, desc: 'Canvi de torn a la base: l’equip que entra substitueix l’equip que acaba la guàrdia.', opts: ['3.3', '3.10', '3.2'],
      prompt: 'two pairs of emergency technicians meeting next to an ambulance at the base, one pair handing the keys and a radio to the other, early morning light' },
    { id: 's3-62', code: '3.62', lvl: 3, desc: 'Després d’un servei molt dur amb un infant, l’equip necessita aturar-se abans de tornar a estar disponible.', opts: ['3.60', '3.2', '3.6'],
      prompt: 'the two technicians sitting quietly on the back step of a parked ambulance, heads lowered, one placing a supportive hand on the other’s shoulder, soft evening light, calm and respectful mood' },
  ];

  /* ---------- Fase 2 · Classificació (es mostren 12 a l'atzar) ---------- */
  const CLASSIFY_POOL = ['3.0', '3.01', '3.02', '3.8', '3.2', '3.3', '3.6', '3.9', '3.16', '3.17', '3.62', '3.60',
    '3.4', '3.5', '3.35', '3.50', '3.51', '3.52', '3.21', '3.7', '3.70', '3.14', '3.18', '3.19', '3.73',
    '3.23', '3.25', '3.28', '3.29', '3.30', '3.31', '3.33', '3.71', '3.1 S', '3.13', '3.20', '3.40'];

  /* ---------- Fase 4 · La línia del servei ---------- */
  const SEQUENCES = [
    { id: 'q1', title: 'Accident de trànsit a la Ronda de Dalt', steps: ['3.3', '3.35', '3.4', '3.5', '3.52', '3.6', '3.10'] },
    { id: 'q2', title: 'Aturada al centre comercial', steps: ['3.3', '3.35', '3.4', '3.0', '3.01', '3.51', '3.6'] },
    { id: 'q3', title: 'Pacient agitat amb risc', steps: ['3.3', '3.35', '3.73', '3.43', '3.4', '3.52', '3.6'] },
  ];

  /* ---------- Fase 5 · Descodifica ---------- */
  const DECODE = [
    { id: 'd1', msg: 'Bravo 727 de CECOS. Servei, 3.23 camió-cotxe Ronda de Dalt, alçada hospital Vall d’Hebron.',
      say: 'Bravo set-cents vint-i-set de CECOS. Servei, tres punt vint-i-tres, camió-cotxe, Ronda de Dalt, alçada hospital Vall d’Hebron.',
      ok: 'Teniu un servei: accident de trànsit entre un camió i un cotxe a la Ronda de Dalt, a l’altura de l’hospital.',
      bad: ['Torneu a la base: s’anul·la el servei de la Ronda de Dalt.', 'Hi ha una caiguda a la via pública a la Ronda de Dalt.'], who: 'CECOS → B727', what: 'Accident de trànsit', where: 'Ronda de Dalt' },
    { id: 'd2', msg: 'B727, ampliïn 3.5 en realitzar 3.4.',
      say: 'Bravo set-cents vint-i-set, ampliïn tres punt cinc en realitzar tres punt quatre.',
      ok: 'Quan arribeu al lloc, doneu més informació de la situació i del pacient.',
      bad: ['Doneu la vostra localització quan arribeu a la base.', 'Quan acabeu el servei, torneu a estar operatius.'], who: 'CECOS → B727', what: 'Demanar informació', where: 'Lloc de l’incident' },
    { id: 'd3', msg: 'Bravo 749 de CECOS. Presència de 3.18 per petició de familiars de la víctima.',
      say: 'Bravo set-cents quaranta-nou de CECOS. Presència de tres punt divuit per petició de familiars de la víctima.',
      ok: 'Els Bombers també aniran al lloc perquè ho han demanat els familiars.',
      bad: ['Cal que vingui la policia perquè els familiars estan agressius.', 'Els familiars demanen una segona ambulància.'], who: 'CECOS → B749', what: 'Bombers al lloc', where: 'Domicili de la víctima' },
    { id: 'd4', msg: 'CECOS de la Bravo 727. 3.1 Sierra per sol·licitar 3.52 a l’Hospital de Sant Pau.',
      say: 'CECOS de la Bravo set-cents vint-i-set. Tres punt u Sierra per sol·licitar tres punt cinquanta-dos a l’Hospital de Sant Pau.',
      ok: 'La unitat demana una trucada sanitària per fer un trasllat sense metge ni infermer a l’Hospital de Sant Pau.',
      bad: ['La unitat demana un trasllat amb metge a Sant Pau.', 'La unitat avisa que ha arribat a l’Hospital de Sant Pau.'], who: 'B727 → CECOS', what: 'Trasllat no assistit', where: 'Hospital de Sant Pau' },
    { id: 'd5', msg: 'CECOS de la Bravo 727. 3.5 per 3.6, i el 3.6 l’enviem per tablet.',
      say: 'CECOS de la Bravo set-cents vint-i-set. Tres punt cinc per tres punt sis, i el tres punt sis l’enviem per tauleta.',
      ok: 'La unitat vol donar la informació del final del servei i l’envia per la tauleta.',
      bad: ['La unitat diu que no està operativa i torna a la base.', 'La unitat demana informació d’un nou servei.'], who: 'B727 → CECOS', what: 'Fi del servei', where: 'Hospital de destí' },
    { id: 'd6', msg: 'A totes les unitats de CECOS: 3.40.',
      say: 'A totes les unitats de CECOS: tres punt quaranta.',
      ok: 'Silenci a la xarxa: hi ha un comunicat d’emergència i no s’ha de parlar per ràdio.',
      bad: ['Totes les unitats han de tornar a la base.', 'Totes les unitats han de dir on són.'], who: 'CECOS → totes', what: 'Silenci a la xarxa', where: 'Tota la xarxa' },
  ];

  /* ---------- Fase 6 · Simulador de ràdio (guions de la pràctica) ----------
     type 'rx': CECOS parla (àudio). type 'tx': l'alumne prem PTT i tria què diu. */
  const RADIO = [
    { id: 'r1', title: 'Inici de guàrdia', unit: 'Bravo 727', steps: [
      { type: 'tx', prompt: 'Comenceu la guàrdia. Truqueu CECOS.', ok: 'CECOS de la Bravo 727.', bad: ['Bravo 727 de CECOS.', 'Hola, som l’ambulància de Vall d’Hebron.'], why: 'Primer el destinatari i després qui crida: «CECOS de la Bravo 727».' },
      { type: 'rx', text: 'Endavant Bravo 727 de CECOS.', say: 'Endavant Bravo set-cents vint-i-set de CECOS.' },
      { type: 'tx', prompt: 'Comuniqueu que la unitat està disponible.', ok: '3.3, sortim amb la unitat B727 i els ISSI 4807271 i 4807274.', bad: ['3.6, sortim amb la unitat B727.', '3.35, sortim amb la unitat B727.'], why: '3.3 = recurs operatiu. El 3.6 és el final d’un servei i el 3.35 és la mobilització cap a un servei.' },
      { type: 'rx', text: 'Rebut. Bon dia i bona guàrdia.', say: 'Rebut. Bon dia i bona guàrdia.' },
      { type: 'tx', prompt: 'Tanqueu la comunicació.', ok: 'Igualment CECOS, bon dia i bona guàrdia.', bad: ['Corto i canvi.', '3.10.'], why: 'Es respon amb cortesia i es tanca. El 3.10 seria «retorn a base».' },
    ] },
    { id: 'r2', title: 'Assignació d’un servei', unit: 'Bravo 727', steps: [
      { type: 'rx', text: 'Bravo 727 de CECOS.', say: 'Bravo set-cents vint-i-set de CECOS.' },
      { type: 'tx', prompt: 'CECOS us crida. Responeu.', ok: 'Endavant CECOS per la Bravo 727.', bad: ['3.3 CECOS.', 'Rebut CECOS.'], why: 'Quan et criden, contestes «Endavant» perquè CECOS parli.' },
      { type: 'rx', text: 'Servei, 3.23 camió-cotxe Ronda de Dalt, alçada hospital Vall d’Hebron. El 3.21 el passem per l’embarcat.', say: 'Servei, tres punt vint-i-tres, camió-cotxe, Ronda de Dalt, alçada hospital Vall d’Hebron. El tres punt vint-i-u el passem per l’embarcat.' },
      { type: 'tx', prompt: 'Confirmeu que ho heu entès.', ok: 'Rebut.', bad: ['3.23 rebut, però on és?', 'Endavant.'], why: '«Rebut» confirma el missatge. La localització (3.21) arriba per l’embarcat.' },
      { type: 'rx', text: 'Bravo 727 de CECOS. Ampliem 3.5 amb diferents alertants en el 3.21.', say: 'Bravo set-cents vint-i-set de CECOS. Ampliem tres punt cinc amb diferents alertants en el tres punt vint-i-u.' },
      { type: 'tx', prompt: 'Què us acaben de dir?', ok: 'Rebut CECOS (hi ha més informació de la situació: diversos alertants al lloc).', bad: ['Rebut CECOS (cal anar a un altre lloc).', 'Rebut CECOS (s’anul·la el servei).'], why: '3.5 = informació de la situació; 3.21 = localització.' },
    ] },
    { id: 'r3', title: 'Sol·licitud de trasllat', unit: 'Bravo 727', steps: [
      { type: 'tx', prompt: 'Heu valorat un pacient amb un traumatisme a la cama. Truqueu CECOS.', ok: 'CECOS de la Bravo 727.', bad: ['Bravo 727 de CECOS.', 'CECOS, endavant.'], why: 'Destinatari + «de» + qui crida.' },
      { type: 'rx', text: 'Endavant B727.', say: 'Endavant Bravo set-cents vint-i-set.' },
      { type: 'tx', prompt: 'Demaneu un trasllat sense metge a Sant Pau, on té la història clínica.', ok: '3.1 Sierra per sol·licitar 3.52, pacient amb traumatisme a la cama i història clínica a l’Hospital de Sant Pau.', bad: ['3.1 Sierra per sol·licitar 3.51 a l’Hospital de Sant Pau.', '3.19 a l’Hospital de Sant Pau.'], why: '3.52 = trasllat NO assistit. El 3.51 porta metge o infermer i el 3.19 demana una altra unitat.' },
      { type: 'rx', text: 'Endavant 3.52 a Hospital de Sant Pau.', say: 'Endavant tres punt cinquanta-dos a Hospital de Sant Pau.' },
      { type: 'tx', prompt: 'Confirmeu.', ok: 'Rebut CECOS.', bad: ['3.6.', 'Endavant.'], why: 'Confirmes amb «Rebut». El 3.6 arribarà al final.' },
    ] },
    { id: 'r4', title: 'Finalització del servei', unit: 'Bravo 727', steps: [
      { type: 'tx', prompt: 'El pacient ja és a l’hospital. Truqueu CECOS.', ok: 'CECOS de la Bravo 727.', bad: ['Bravo 727 de CECOS.', '3.6 CECOS.'], why: 'Sempre s’obre la comunicació abans de donar codis.' },
      { type: 'rx', text: 'Endavant Bravo 727.', say: 'Endavant Bravo set-cents vint-i-set.' },
      { type: 'tx', prompt: 'Demaneu donar la informació de final de servei.', ok: '3.5 per 3.6.', bad: ['3.10 per 3.6.', '3.4 per 3.6.'], why: '«3.5 per 3.6»: informació de l’afectat per tancar el servei.' },
      { type: 'rx', text: 'Endavant 3.6.', say: 'Endavant tres punt sis.' },
      { type: 'tx', prompt: 'Doneu les dades del pacient.', ok: 'Pacient 3.23 amb traumatisme a l’extremitat inferior dreta, codi de patologia i codi de gravetat.', bad: ['Pacient 3.29 amb traumatisme al cap.', 'Pacient 3.0 recuperat.'], why: 'El pacient era d’un accident de trànsit (3.23) i es donen patologia i gravetat.' },
      { type: 'rx', text: 'Rebut.', say: 'Rebut.' },
    ] },
  ];

  const POINTS = { f1: 150, f2: 150, f3: 200, f4: 150, f5: 100, f6: 250 };

  return { CODES, FAMILIES, INTERCO, SPELL, LISTEN, SCENES, CLASSIFY_POOL, SEQUENCES, DECODE, RADIO, POINTS,
    byCode: Object.fromEntries(CODES.map(c => [c.code, c])) };
})();
