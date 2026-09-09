// Original SVG illustrations for KidsEdu. Run: node scripts/generate-play-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../public/assets/illustrations/', import.meta.url));
mkdirSync(root, { recursive: true });
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const rect = (x,y,w,h,fill,r=6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const wheel = (x,y=124,r=18) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#31465a"/><circle cx="${x}" cy="${y}" r="${r*.46}" fill="#e3edf0" stroke-width="3"/>`;
const wheels = () => wheel(57)+wheel(181);
const glass = '#bce9f3';
const light = rect(99,47,17,10,'#ff706c',3)+rect(116,47,17,10,'#61a7f1',3);
const car = (color,extra='') => path('M21 112V98Q21 85 43 84L69 59Q73 55 85 55H137Q147 55 155 65L176 84L205 89Q220 92 220 106V117H21Z',color)+path('M78 63H107V83H58Z',glass)+path('M115 63H138L156 83H115Z',glass)+path('M112 91V113M126 94H137','#fff','stroke-width="3"')+rect(204,95,14,9,'#fff4b2',3)+rect(22,98,9,9,'#ff706c',3)+extra+wheels();
const cab = (color='#f8bb45') => path('M152 67H186L214 94V122H150Z',color)+path('M161 75H182L199 94H161Z',glass)+rect(200,104,14,8,'#fff0ae',2);
const chassis = () => rect(24,111,190,14,'#5b7280');
const tracks = () => rect(27,112,125,29,'#31465a',14)+[43,70,97,125].map(x=>wheel(x,127,9)).join('');
const assets = {};
assets['car'] = car('#fa7866');
assets['suv'] = path('M21 114V86H51L66 47H157L181 83H211V119H21Z','#5caaa0')+path('M74 56H107V81H60Z',glass)+rect(115,56,36,25,glass,2)+rect(32,92,18,8,'#fff4b2',2)+wheels();
assets['police-car'] = car('#fcfcf2',rect(29,101,183,13,'#508cc9',2)+path('M113 91L123 95V104Q120 110 113 113Q106 110 103 104V95Z','#ffd064'))+light;
assets['taxi'] = car('#ffcf54')+rect(96,44,38,12,'#fff9d9',3)+[76,88,100,112,124,136].map((x,i)=>rect(x,103,12,9,i%2?'#fff9d9':'#31465a',0)).join('');
assets['race-car'] = path('M18 116V101L75 86L95 67H136L164 91L218 99V119H18Z','#e9706b')+path('M99 74H130L144 90H83Z',glass)+path('M176 94V75H210V83H188V96','#f7c553')+path('M39 102H66M94 103H151','#fff','stroke-width="7"')+wheels();
assets['pickup'] = path('M22 119V81H100V53H153L181 86H209V119Z','#62abdb')+path('M110 63H145L164 84H110Z',glass)+path('M31 91H90M105 93V115','#fff','stroke-width="4"')+wheels();
assets['ambulance'] = rect(22,49,132,73,'#fffdf1')+cab('#fffdf1')+rect(25,105,128,13,'#ee866b',2)+path('M78 65H94V77H106V93H94V105H78V93H66V77H78Z','#53a994')+rect(169,55,17,10,'#f57769',3)+wheels();
assets['fire-truck'] = rect(22,68,130,53,'#ed7066')+cab('#ed7066')+rect(35,84,53,29,'#c5d7da')+`<circle cx="119" cy="99" r="15" fill="#fff0d7"/><circle cx="119" cy="99" r="8" fill="#596c7d"/>`+path('M28 58L141 31L145 43L32 70Z','#e4edf0')+[45,65,85,105,125].map(x=>path(`M${x} ${67-(x-28)*.24}L${x-3} ${55-(x-28)*.24}`,'none')).join('')+rect(166,55,17,10,'#65a6e8',3)+wheels();
assets['bus'] = rect(19,46,201,76,'#efc657',12)+[31,68,105,142].map(x=>rect(x,57,28,28,glass,3)).join('')+rect(180,58,28,57,glass,3)+path('M195 60V115M25 99H170','none','stroke="#c28b35"')+wheels();
assets['truck'] = rect(22,41,126,80,'#9b9cdb')+cab('#e6ad56')+path('M39 51V107M61 51V107M83 51V107M105 51V107M127 51V107','none','stroke="#7479b6" stroke-width="3"')+wheels();
assets['dump-truck'] = chassis()+path('M19 48L141 59L127 105H39Z','#f8bf48')+path('M45 62L54 93M76 66L81 97M106 70L105 98','none','stroke="#d49430"')+cab('#ef9656')+wheels();
assets['cement-mixer'] = chassis()+`<g transform="rotate(-18 87 78)">${rect(31,49,113,52,'#8bbdc1',24)}${path('M67 49L83 101M96 49L112 101','none','stroke="#f4ead4" stroke-width="13"')}</g>`+cab('#f0bd58')+wheels();
assets['crane'] = chassis()+rect(30,71,59,42,'#f3bd49')+rect(38,78,31,23,glass,3)+path('M88 94L178 22L187 33L99 105Z','#f3bd49')+path('M181 28V77Q181 89 192 83','none')+`<circle cx="92" cy="100" r="9" fill="#f18e4f"/>`+wheels();
assets['excavator'] = tracks()+rect(34,82,93,30,'#f3bc48')+path('M54 83V45H98L113 83Z','#f3bc48')+path('M64 55H90L100 78H64Z',glass)+path('M111 93L146 33L175 41L199 93L188 99L163 52L153 52L127 101Z','#f3bc48')+path('M187 91L215 87L223 115Q197 127 180 105Z','#d59343')+`<circle cx="153" cy="43" r="6" fill="#fdf0cb"/>`;
assets['bulldozer'] = tracks()+rect(38,83,112,28,'#f1b845')+rect(52,41,62,43,'#f1b845')+rect(62,51,41,28,glass,3)+path('M147 96L187 114M145 108L187 125','none','stroke-width="9"')+path('M185 89L208 82V139H178Z','#c3d5d9');
assets['forklift'] = rect(58,88,95,33,'#eda858')+path('M64 88V41H121V88','none','stroke-width="8"')+rect(83,75,30,14,'#536b7b',3)+path('M160 37V124H219V136H149V37Z','#6c8490')+wheel(77,125,17)+wheel(135,125,14);
assets['tractor'] = rect(36,87,130,30,'#70b088')+rect(120,46,53,54,'#70b088')+rect(130,55,34,30,glass,3)+path('M117 43H177M64 85V61','none','stroke-width="8"')+rect(45,94,25,13,'#d9edc4',3)+wheel(58,128,18)+wheel(159,117,28);
assets['roller'] = rect(39,83,113,31,'#f6c255')+rect(54,42,57,42,'#f6c255')+rect(63,51,39,26,glass,3)+path('M146 98L186 113','none','stroke-width="10"')+wheel(66,122,22)+rect(155,105,59,34,'#9ab3bf',14)+path('M168 109V135M201 109V135','none','stroke="#dbe6e8" stroke-width="3"');
assets['train'] = rect(38,74,100,46,'#65aaa2')+rect(139,48,63,73,'#e99b60')+rect(151,58,38,27,glass,3)+rect(51,49,21,26,'#65aaa2',2)+rect(43,42,37,10,'#4c8d89',3)+path('M26 112L13 131H210V117','#efbf55')+[55,111,172].map(x=>wheel(x,127,15)).join('')+path('M55 127H172','none','stroke="#e7ebdc" stroke-width="5"');
assets['airplane'] = path('M25 104L12 62H34L65 93H193Q213 94 224 109Q215 120 193 120H34Z','#fff5d9')+path('M93 104L119 51H144L128 105M95 113L126 146H152L130 114','#69abd3')+[63,86,109,157,180].map(x=>rect(x,98,10,9,glass,3)).join('')+path('M193 99L205 102L211 109H192Z',glass);
assets['helicopter'] = path('M70 111L19 85L14 58H34L41 83L91 82Z','#efbb56')+path('M68 111Q62 64 119 63Q180 62 207 102Q220 129 167 129H99Q75 129 68 111Z','#efbb56')+path('M149 74Q181 80 194 102H145Z',glass)+rect(102,78,30,26,glass)+path('M133 62V41M61 39H208M96 131V141H188M166 131V141','none','stroke-width="6"')+path('M11 76H39','none','stroke-width="5"');
assets['boat'] = path('M30 108H216L191 140H55Z','#69aeba')+path('M111 22V104H192Z','#f7d576')+path('M100 45V104H45Z','#f7f2dd')+path('M107 20V107','none')+path('M28 145Q43 136 59 145T91 145T123 145T155 145T187 145T219 145','none','stroke="#9dcdd1" stroke-width="5"');
// Collectible transport illustrations, sharing the same outline and palette.
assets['high-speed-train'] = path('M24 119V72Q25 51 51 51H150Q181 51 219 110L222 124H24Z','#f9f6e6')+path('M156 65Q178 71 197 96H155Z',glass)+[36,72,108].map(x=>rect(x,67,25,23,glass,4)).join('')+path('M26 106H202','none','stroke="#d57266" stroke-width="8"')+wheel(59,130,11)+wheel(171,130,11);
assets['monorail'] = assets['high-speed-train']+rect(17,140,207,7,'#839ca5',2);
assets['tram'] = rect(22,58,195,67,'#79b19b',12)+[35,72,109,146].map(x=>rect(x,70,28,26,glass,3)).join('')+rect(181,72,24,48,glass,3)+path('M93 55L110 36L130 52M76 30H157','none')+wheel(56,130,10)+wheel(184,130,10);
assets['submarine'] = rect(31,73,180,61,'#eac75f',30)+path('M117 72V45H143V55H130V72','#eac75f')+[71,117,163].map(x=>`<circle cx="${x}" cy="102" r="14" fill="${glass}"/>`).join('')+path('M22 85V127M14 92H32M14 121H32','none');
assets['submersible'] = assets['submarine']+path('M163 126L184 142L201 132','none','stroke-width="7"');
assets['speedboat'] = path('M19 105H220L184 132H43Z','#e97e68')+path('M68 104L104 72H153L181 104Z','#fff2db')+path('M110 80H149L164 97H98Z',glass)+path('M20 141Q38 132 57 141T95 141T133 141T171 141T209 141','none','stroke="#9dcdd1"');
assets['hovercraft'] = rect(15,112,207,27,'#596e79',14)+path('M52 110L77 70H148L179 110Z','#e8bd61')+path('M85 79H119V99H71Z',glass)+rect(129,79,24,20,glass,3)+`<circle cx="190" cy="83" r="26" fill="#deeaeb"/><path d="M174 67L206 99M174 99L206 67" stroke-width="6"/>`;
assets['cruise-ship'] = path('M18 109H223L197 140H46Z','#6c9caf')+path('M47 109V90H71V64H101V46H165V65H189V109Z','#fff4dc')+rect(120,27,27,20,'#e88c70',3)+[79,108,137,166].map(x=>rect(x,80,16,13,glass,3)).join('')+path('M30 120H207','none','stroke="#eecca0" stroke-width="4"');
assets['cable-car'] = path('M22 25H217M116 25V57','none','stroke-width="6"')+rect(55,57,130,81,'#dd9272',16)+rect(67,70,46,36,glass,4)+rect(125,70,46,36,glass,4)+path('M64 119H177','none','stroke="#f9e8be"');
assets['motorcycle'] = wheel(51,123,23)+wheel(187,123,23)+path('M52 122L88 78L129 122H52L103 89H163L187 122','none','stroke="#6eaea2" stroke-width="9"')+path('M83 77H113M156 68L145 54H131','none','stroke-width="9"')+path('M102 89L119 68H146L161 89Z','#e7b35f');
assets['scooter'] = wheel(51,127,18)+wheel(182,127,18)+path('M50 116Q70 87 105 94L109 116H151L145 64H164L180 116H190V126H54Z','#e893a5')+path('M147 63L133 50H121M76 91H111','none','stroke-width="8"');
assets['hot-air-balloon'] = path('M118 16Q166 15 166 57Q166 83 136 106H101Q72 83 72 57Q72 16 118 16Z','#e7896e')+path('M118 17Q144 40 129 101H110Q96 44 118 17Z','#f8d887')+path('M101 106L106 120M136 106L132 120','none')+rect(105,119,29,24,'#bc9569',3);
assets['hang-glider'] = path('M119 22L20 91L121 70L219 91Z','#70b5b2')+path('M119 22L121 70L162 103Z','#ecc264')+path('M120 72L103 104L143 104Z','none')+`<circle cx="121" cy="114" r="7" fill="#e6b991"/>`+path('M120 122L102 137M120 122L138 138','none','stroke-width="6"');
assets['zipline'] = path('M14 33L220 17M125 25L123 71','none','stroke-width="5"')+`<circle cx="122" cy="87" r="13" fill="#eccca2"/>`+path('M104 77L119 72L137 78M120 101L119 121L144 134M119 121L96 137','none','stroke="#659d9b" stroke-width="10"');
assets['snowmobile'] = rect(30,112,100,26,'#536c78',13)+path('M37 111L69 80H109L148 109H197L212 126H145Z','#d78069')+path('M111 87L114 54L146 86Z',glass)+path('M162 127V137H222M53 80H101','none','stroke-width="7"');
assets['ufo'] = `<ellipse cx="120" cy="99" rx="103" ry="31" fill="#9b9bcf"/>`+path('M65 82Q67 27 120 27Q173 27 175 82Z',glass)+`<ellipse cx="120" cy="91" rx="92" ry="16" fill="#bdb6df"/>`+[53,98,143,188].map(x=>`<circle cx="${x}" cy="105" r="6" fill="#ffebaa" stroke-width="2"/>`).join('');
assets['light-plane'] = assets['airplane']+path('M198 77V132','none','stroke-width="6"');
assets['fighter'] = path('M16 100L82 91L121 30H144L124 91L213 100L124 110L144 147H121L82 110L16 113Z','#9bb8bf')+path('M152 97L189 101L152 106Z',glass);
assets['shuttle'] = path('M52 124L79 94L103 45Q120 10 137 45L161 94L190 124L155 128L135 114H103L83 128Z','#f9f4e0')+path('M107 52H133L140 65H100Z',glass)+path('M79 94L65 118L99 112M161 94L178 118L143 112','#718b9f')+path('M108 125L120 151L133 125','#eaaa5d');
assets['trophy'] = path('M73 28H166V61Q165 97 120 106Q75 97 73 61Z','#efc557')+path('M73 40H46V64Q46 85 81 88M166 40H193V64Q193 85 160 88','none','stroke="#d5a045" stroke-width="9"')+path('M118 107V126M90 133H152','none','stroke="#d5a045" stroke-width="11"')+path('M120 43L126 57L142 59L130 70L133 85L120 77L107 85L110 70L98 59L114 57Z','#fff3bc');
for (const [id, drawing] of Object.entries(assets)) writeFileSync(`${root}${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160"><ellipse cx="120" cy="145" rx="103" ry="7" fill="#31465a" opacity=".09"/><g stroke="#384e60" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${drawing}</g></svg>\n`);
const layers = {
 'bun-bottom': path('M18 21H222V36Q221 56 197 57H44Q20 55 18 36Z','#edb263')+path('M26 29H214','none','stroke="#ffd993" stroke-width="8"'),
 'bun-top': path('M18 55Q24 8 120 7Q215 8 222 55Z','#efb261')+path('M31 47Q47 20 87 19','none','stroke="#ffce81" stroke-width="6"')+[57,91,125,159,188].map((x,i)=>path(`M${x} ${i%2?24:38}l5 -3`,'none','stroke="#fff3c6" stroke-width="4"')).join(''),
 patty: path('M23 18Q118 10 219 18Q237 24 218 46Q120 55 25 46Q8 37 23 18Z','#845444')+path('M40 29l22 5m19 -7l24 8m21 -8l23 8m20 -8l23 4','none','stroke="#ae7560" stroke-width="5"'),
 lettuce: path('M15 27Q24 13 44 23Q59 10 80 21Q99 10 120 21Q141 9 159 23Q184 10 200 24Q230 14 227 34Q226 49 205 41Q184 55 163 40Q143 55 123 41Q96 54 80 39Q60 53 43 38Q18 51 15 27Z','#7dbb59')+path('M35 30Q120 41 205 30','none','stroke="#b7d985" stroke-width="4"'),
 tomato: `<ellipse cx="120" cy="32" rx="105" ry="23" fill="#eb7567"/>${path('M28 33Q120 52 211 32','none','stroke="#b94e47"')}${[53,84,115,146,177].map(x=>path(`M${x} 27l7 5`,'none','stroke="#ffd38d" stroke-width="4"')).join('')}`,
 cheese: path('M18 21L190 12L225 37L152 44L139 58L109 45L39 48Z','#f6ce56')+path('M45 26L173 21','none','stroke="#fff0a4" stroke-width="4"'),
 egg: path('M17 32Q28 11 53 19Q83 1 110 15Q140 7 165 21Q200 9 220 26Q237 41 210 48Q191 60 158 48Q119 61 89 47Q55 58 31 45Q12 46 17 32Z','#fffbdf')+`<ellipse cx="122" cy="29" rx="32" ry="18" fill="#f4c14f" stroke="#d89739"/>`,
 bacon: path('M16 19Q47 6 73 22T130 22T188 22L222 18L224 41Q197 54 168 40T110 40T53 40L19 44Z','#cd7771')+path('M25 28Q49 19 73 31T131 31T190 31L216 27','none','stroke="#f6c5a1" stroke-width="7"'),
 onion: `<ellipse cx="120" cy="32" rx="101" ry="23" fill="#e1b6d7"/><ellipse cx="120" cy="30" rx="80" ry="14" fill="#fff1e5" stroke="#b784b3"/><ellipse cx="120" cy="30" rx="47" ry="9" fill="none" stroke="#d4a0c9"/>`,
};
for (const [id,drawing] of Object.entries(layers)) writeFileSync(`${root}burger-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64"><g stroke="#835742" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${drawing}</g></svg>\n`);
writeFileSync(`${root}CREDITS.txt`, 'Original vector illustrations authored for KidsEdu.\nVehicle and burger SVG source: scripts/generate-play-assets.mjs\nNo external fonts, emoji glyphs, remote images or paid assets required.\nExisting animal and space art: ../kenney/CREDITS.txt\n');
console.log(`Created ${Object.keys(assets).length} vehicle and ${Object.keys(layers).length} ingredient illustrations.`);
writeFileSync(`${root}burger.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 210"><ellipse cx="120" cy="194" rx="112" ry="11" fill="#c3d8d4"/><g stroke="#835742" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${['bun-bottom','patty','cheese','tomato','lettuce','bun-top'].map((id,i)=>`<g transform="translate(0 ${143-i*25})">${layers[id]}</g>`).join('')}</g></svg>\n`);
