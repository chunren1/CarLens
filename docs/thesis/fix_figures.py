# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math
OUT=Path('/home/user/projects/wangshu/docs/thesis/figures')
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'; BOLD='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
NAVY='#0B1723'; BLUE='#1B6F95'; ACCENT='#4EB1DD'; LIGHT='#F3F7FA'; LINE='#9FB4C4'; TEXT='#22313F'
def font(s,b=False): return ImageFont.truetype(BOLD if b else FONT,s)
def new(w,h):
 im=Image.new('RGB',(w,h),'white'); return im,ImageDraw.Draw(im)
def box(d,x1,y1,x2,y2,t,lines=None,fs=22,fb=26,fill=LIGHT):
 d.rounded_rectangle([x1,y1,x2,y2],radius=14,fill=fill,outline=BLUE,width=3)
 d.text(((x1+x2)/2,y1+14),t,font=font(fb,True),fill=NAVY,anchor='ma')
 if lines:
  yy=y1+52
  for l in lines:
   d.text(((x1+x2)/2,yy),l,font=font(fs),fill=TEXT,anchor='ma'); yy+=32
def arrow(d,x1,y1,x2,y2,c=ACCENT):
 d.line([x1,y1,x2,y2],fill=c,width=4); ang=math.atan2(y2-y1,x2-x1); L=14
 for s in(-0.5,0.5): d.line([x2,y2,x2-L*math.cos(ang+s),y2-L*math.sin(ang+s)],fill=c,width=4)
def actor(d,cx,cy,label):
 d.ellipse([cx-16,cy-82,cx+16,cy-50],outline=NAVY,width=4)
 d.line([cx,cy-50,cx,cy-12],fill=NAVY,width=4); d.line([cx-30,cy-36,cx+30,cy-36],fill=NAVY,width=4)
 d.line([cx,cy-12,cx-24,cy+24],fill=NAVY,width=4); d.line([cx,cy-12,cx+24,cy+24],fill=NAVY,width=4)
 d.text((cx,cy+35),label,font=font(22,True),fill=NAVY,anchor='ma')
def oval(d,x1,y1,x2,y2,t):
 d.ellipse([x1,y1,x2,y2],fill='white',outline=BLUE,width=3)
 d.text(((x1+x2)/2,(y1+y2)/2),t,font=font(20),fill=NAVY,anchor='mm')

# usecase
im,d=new(1800,1000)
d.text((900,38),'车鉴 CarLens 用例图',font=font(32,True),fill=NAVY,anchor='ma')
d.rounded_rectangle([390,110,1470,930],radius=16,outline=LINE,width=3)
d.text((930,126),'系统边界',font=font(20),fill=TEXT,anchor='ma')
actor(d,190,360,'访客'); actor(d,190,720,'登录用户'); actor(d,1610,360,'运营管理员')
cols=[(430,730),(790,1090),(1150,1450)]
rows=[(190,290),(350,450),(510,610)]
labels=[['浏览车型/海报','配置器试算','车型对比/向导'],['保存配置/报价','下订/模拟支付','订单/试驾'],['后台概览','订单/线索','车型/门店/新闻']]
for ci,(x1,x2) in enumerate(cols):
 for ri,(y1,y2) in enumerate(rows): oval(d,x1,y1,x2,y2,labels[ci][ri])
# lines visitor to left col
for y in [240,400,560]: d.line([225,360,430,y],fill=LINE,width=3)
# user to middle
for y in [240,400,560]: d.line([225,720,790,y],fill=LINE,width=3)
# admin to right
for y in [240,400,560]: d.line([1575,360,1450,y],fill=LINE,width=3)
d.text((900,805),'说明：访客可浏览与试算；登录用户增加交易、订单和试驾；管理员进入后台。',font=font(21),fill=TEXT,anchor='ma')
im.save(OUT/'usecase.png')

# flow
im,d=new(1900,850)
d.text((950,35),'配置—报价—下订主流程',font=font(32,True),fill=NAVY,anchor='ma')
top=[('进入车型',80),('选择版本/选装',370),('服务端报价',660),('确认配置快照',950),('填写购车信息',1240)]
for t,x in top: box(d,x,190,x+230,310,t,fs=18)
for i in range(len(top)-1): arrow(d,top[i][1]+230,250,top[i+1][1],250)
bottom=[('创建订单',1240),('模拟支付',950),('订单状态',660),('后台处理',370),('完成/取消',80)]
for t,x in bottom: box(d,x,540,x+230,660,t,fs=18)
arrow(d,1355,310,1355,540)
for i in range(len(bottom)-1): arrow(d,bottom[i][1],600,bottom[i+1][1]+230,600)
d.text((685,330),'选项不合法：返回配置器',font=font(18),fill='#9A5A17')
d.text((685,690),'支付失败：留在支付页重试',font=font(18),fill='#9A5A17')
im.save(OUT/'flow.png')

# ER
im,d=new(1900,1000)
d.text((950,30),'核心实体关系（简化）',font=font(32,True),fill=NAVY,anchor='ma')
box(d,690,110,1210,250,'models 车型',['id / slug / brand / price_from / range_km'],fs=19,fb=25)
box(d,190,330,620,490,'trims 版本',['model_id / name / price / rank'],fs=19,fb=25)
box(d,1280,330,1710,490,'model_options 车型选装',['model_id / kind / option_id / price'],fs=19,fb=25)
box(d,690,650,1210,810,'orders 订单',['order_no / config_json / total'],fs=19,fb=25)
box(d,80,650,470,810,'users 用户',['id / email / role'],fs=19,fb=25)
box(d,1430,650,1820,810,'stores 门店',['id / city / address'],fs=19,fb=25)
# lines
arrow(d,800,250,500,330); d.text((590,270),'1:N',font=font(18),fill=BLUE)
arrow(d,1100,250,1400,330); d.text((1260,270),'1:N',font=font(18),fill=BLUE)
arrow(d,950,250,950,650); d.text((970,560),'1:N',font=font(18),fill=BLUE)
arrow(d,690,730,470,730); d.text((520,700),'N:1',font=font(18),fill=BLUE)
arrow(d,1210,730,1430,730); d.text((1300,700),'N:1',font=font(18),fill=BLUE)
im.save(OUT/'er.png')

# deployment
im,d=new(1800,900)
d.text((900,30),'部署拓扑',font=font(32,True),fill=NAVY,anchor='ma')
box(d,60,210,330,380,'浏览器',['桌面 / 移动','Vue SPA'],fs=18,fb=24)
box(d,420,190,720,400,'Cloudflare Tunnel',['HTTPS / 访问入口'],fs=18,fb=24)
box(d,820,170,1150,420,'nginx',['静态 / /var/www/wangshu','/api/ → 127.0.0.1:3100','安全头 / 缓存'],fs=18,fb=24)
box(d,1260,110,1660,270,'静态资源',['assets / images / s7.glb'],fs=18,fb=24)
box(d,1260,360,1660,520,'Fastify API',['systemd / Node 24','Zod / Drizzle'],fs=18,fb=24)
box(d,1260,650,1660,810,'SQLite 数据库',['/opt/wangshu/data','迁移 / 备份'],fs=18,fb=24)
box(d,720,650,1050,810,'运维',['deploy-ip.sh','health / 清单清理'],fs=18,fb=24)
for a in [(330,295,420,295),(720,295,820,295),(1150,220,1260,190),(1150,420,1260,440),(1460,520,1460,650)]:
 arrow(d,*a)
im.save(OUT/'deployment.png')
print('fixed figures')
