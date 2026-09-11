"""Derive interactive paths from vendored Twemoji v16.0.1 SVGs (CC BY 4.0)."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path

PAGES = [
 ('fish','물고기','🐟','animals',{0:'꼬리',1:'지느러미',3:'몸'}),
 ('cat','고양이','🐱','animals',{0:'왼쪽 귀',2:'오른쪽 귀',4:'얼굴',6:'입 주변',8:'코'}),
 ('butterfly','나비','🦋','animals',{0:'왼쪽 날개 테두리',2:'왼쪽 날개',5:'오른쪽 날개 테두리',7:'오른쪽 날개'}),
 ('turtle','거북이','🐢','animals',{0:'다리',1:'머리와 몸',2:'등딱지',4:'등딱지 무늬'}),
 ('rocket','로켓','🚀','vehicles',{0:'불꽃 바깥',1:'불꽃',2:'불꽃 안쪽',3:'로켓 몸체',5:'날개'}),
 ('car','자동차','🚗','vehicles',{0:'차체',1:'창문',3:'앞바퀴',5:'뒷바퀴'}),
 ('sailboat','돛단배','⛵','vehicles',{1:'돛대',2:'물결',3:'배',4:'배 그림자',5:'돛'}),
 ('helicopter','헬리콥터','🚁','vehicles',{1:'왼쪽 프로펠러',2:'오른쪽 프로펠러',5:'몸체',6:'꼬리',7:'창문'}),
 ('sunflower','해바라기','🌻','nature',{0:'줄기와 잎',1:'꽃잎',2:'꽃 가운데'}),
 ('tulip','튤립','🌷','nature',{0:'줄기와 잎',1:'바깥 꽃잎',2:'안쪽 꽃잎'}),
 ('rainbow','무지개','🌈','nature',{0:'첫째 무지개',1:'둘째 무지개',2:'셋째 무지개',3:'넷째 무지개',4:'다섯째 무지개',5:'여섯째 무지개'}),
 ('mushroom','버섯','🍄','nature',{0:'기둥',1:'갓',2:'왼쪽 무늬',3:'오른쪽 무늬',4:'가운데 무늬',5:'위쪽 무늬'}),
 ('ice-cream','아이스크림','🍦','food',{0:'콘',1:'콘 테두리',4:'아이스크림',5:'크림 무늬'}),
 ('cupcake','컵케이크','🧁','food',{0:'컵',1:'케이크',4:'크림',7:'빨강 장식',8:'파랑 장식',9:'초록 장식'}),
 ('balloon','풍선','🎈','objects',{0:'풍선 줄',1:'매듭',2:'풍선',3:'빛 무늬'}),
 ('castle','성','🏰','objects',{0:'성벽',1:'깃발',2:'지붕',5:'왼쪽 창문',7:'오른쪽 창문',8:'가운데 탑',9:'문'}),
 ('dog-face','강아지','🐶','animals',{0:'혀',2:'얼굴',3:'입 주변'}),
 ('rabbit-face','토끼','🐰','animals',{0:'귀',1:'귀 안쪽',2:'얼굴',3:'볼',6:'코'}),
 ('lion','사자','🦁','animals',{0:'갈기',1:'왼쪽 귀와 턱',4:'오른쪽 귀',6:'얼굴',8:'입 주변'}),
 ('panda-face','판다','🐼','animals',{2:'왼쪽 귀 안쪽',3:'오른쪽 귀 안쪽',4:'얼굴',5:'입 주변',6:'입'}),
 ('penguin','펭귄','🐧','animals',{0:'발',2:'배',3:'부리'}),
 ('octopus','문어','🐙','animals',{0:'왼쪽 다리',1:'오른쪽 다리',2:'가운데 다리',3:'머리'}),
 ('airplane','비행기','✈️','vehicles',{0:'엔진',1:'날개',2:'몸체',3:'창문'}),
 ('bus','버스','🚌','vehicles',{1:'차체',5:'앞바퀴',7:'뒷바퀴',8:'아래 장식',11:'옆 창문',13:'앞 창문'}),
 ('fire-engine','소방차','🚒','vehicles',{0:'사다리',1:'차체',2:'하얀 줄',4:'앞바퀴',6:'뒷바퀴',7:'창문',9:'경광등'}),
 ('tractor','트랙터','🚜','vehicles',{1:'앞부분',3:'창문',4:'지붕',7:'작은 바퀴',10:'큰 바퀴',12:'뒷부분'}),
 ('cherry-blossom','벚꽃','🌸','nature',{0:'꽃잎',6:'꽃잎 무늬',7:'꽃 가운데'}),
 ('cactus','선인장','🌵','nature',{0:'선인장 몸'}),
 ('palm-tree','야자나무','🌴','nature',{0:'나무줄기',1:'줄기 무늬',2:'뒤쪽 잎',3:'앞쪽 잎'}),
 ('maple-leaf','단풍잎','🍁','nature',{0:'단풍잎'}),
 ('strawberry','딸기','🍓','food',{0:'열매',1:'잎',2:'씨앗'}),
 ('watermelon','수박','🍉','food',{0:'껍질',1:'껍질 안쪽',2:'과육'}),
 ('cherries','체리','🍒','food',{0:'잎',1:'줄기',2:'오른쪽 체리',3:'왼쪽 체리'}),
 ('doughnut','도넛','🍩','food',{0:'도넛 빵',1:'초콜릿',4:'분홍 토핑',5:'파랑 토핑'}),
 ('birthday-cake','생일 케이크','🎂','food',{1:'접시',2:'케이크',3:'크림',5:'맨 위 크림',6:'왼쪽 초',8:'가운데 초',10:'오른쪽 초'}),
 ('teddy-bear','곰 인형','🧸','objects',{0:'몸',1:'배',3:'리본',8:'얼굴',14:'왼쪽 발',17:'오른쪽 발'}),
 ('robot','로봇','🤖','objects',{0:'오른쪽 귀',1:'왼쪽 귀',2:'머리',6:'얼굴',9:'오른쪽 눈',13:'왼쪽 눈'}),
 ('kite','연','🪁','objects',{0:'연 바탕',1:'연 무늬',3:'꼬리',4:'꼬리 리본'}),
 ('gift','선물 상자','🎁','objects',{0:'상자',1:'뚜껑',3:'세로 리본',4:'리본 매듭'}),
 ('soccer-ball','축구공','⚽','objects',{0:'공 바탕',1:'그림자',2:'공 무늬'}),
]
def shapes(node, inherited='#000000', parent_transform=''):
 fill=node.get('fill',inherited)
 transform=' '.join(filter(None,[parent_transform,node.get('transform','')]))
 for child in node:
  tag=child.tag.split('}')[-1]
  color=child.get('fill',fill)
  if tag=='g': yield from shapes(child,fill,transform); continue
  if tag=='path': d=child.attrib['d']
  elif tag in ('ellipse','circle'):
   x,y=float(child.get('cx','0')),float(child.get('cy','0'))
   rx,ry=float(child.get('rx',child.get('r','0'))),float(child.get('ry',child.get('r','0')))
   d=f'M{x-rx} {y}a{rx} {ry} 0 1 0 {2*rx} 0a{rx} {ry} 0 1 0 {-2*rx} 0'
  else: raise ValueError(tag)
  part={'d':d,'color':color}
  combined=' '.join(filter(None,[transform,child.get('transform','')]))
  if combined: part['transform']=combined
  yield part
pages=[]
for slug,name,emoji,category,labels in PAGES:
 artwork=list(shapes(ET.parse(f'public/assets/twemoji/{slug}.svg').getroot()))
 regions=[]
 for index,label in labels.items():
  artwork[index]['regionId']=f'paint-{index}'
  regions.append({'id':f'paint-{index}','label':label,'d':artwork[index]['d'],'color':artwork[index]['color']})
 pages.append({'id':slug,'name':name,'emoji':emoji,'category':category,'viewBox':'-2 -2 40 40','source':f'/assets/twemoji/{slug}.svg','regions':regions,'artwork':artwork})
Path('src/data/coloring-artwork.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2)+'\n')
