# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

OUT = Path('/home/user/projects/wangshu/docs/thesis/figures')
OUT.mkdir(parents=True, exist_ok=True)
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
NAVY = '#0B1723'; BLUE = '#1B6F95'; ACCENT = '#4EB1DD'; LIGHT = '#F3F7FA'; LINE = '#9FB4C4'; TEXT = '#22313F'

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def new(w=1800,h=1000):
    im=Image.new('RGB',(w,h),'white'); return im, ImageDraw.Draw(im)

def box(d,x1,y1,x2,y2,title,lines=None,fill=LIGHT,outline=BLUE,fs=26,fb=30,radius=16):
    d.rounded_rectangle([x1,y1,x2,y2],radius=radius,fill=fill,outline=outline,width=3)
    d.text(((x1+x2)/2,y1+18),title,font=font(fb,True),fill=NAVY,anchor='ma')
    if lines:
        yy=y1+62
        for line in lines:
            d.text(((x1+x2)/2,yy),line,font=font(fs),fill=TEXT,anchor='ma'); yy+=36

def arrow(d,x1,y1,x2,y2,color=ACCENT,w=4):
    d.line([x1,y1,x2,y2],fill=color,width=w)
    ang=math.atan2(y2-y1,x2-x1); L=15
    for s in (-0.55,0.55):
        d.line([x2,y2,x2-L*math.cos(ang+s),y2-L*math.sin(ang+s)],fill=color,width=w)

def diamond(d,cx,cy,w,h,text,fill='#FFF7E8',outline='#C58B2A'):
    pts=[(cx,cy-h/2),(cx+w/2,cy),(cx,cy+h/2),(cx-w/2,cy)]
    d.polygon(pts,fill=fill,outline=outline,width=3)
    d.text((cx,cy),text,font=font(22),fill=NAVY,anchor='mm')

def actor(d,cx,cy,label):
    d.ellipse([cx-18,cy-95,cx+18,cy-59],outline=NAVY,width=4)
    d.line([cx,cy-59,cx,cy-15],fill=NAVY,width=4)
    d.line([cx-32,cy-42,cx+32,cy-42],fill=NAVY,width=4)
    d.line([cx,cy-15,cx-28,cy+25],fill=NAVY,width=4)
    d.line([cx,cy-15,cx+28,cy+25],fill=NAVY,width=4)
    d.text((cx,cy+40),label,font=font(24,True),fill=NAVY,anchor='ma')

def ellipse(d,x1,y1,x2,y2,label,fs=23):
    d.ellipse([x1,y1,x2,y2],fill='#FFFFFF',outline=BLUE,width=3)
    d.text(((x1+x2)/2,(y1+y2)/2),label,font=font(fs),fill=NAVY,anchor='mm')

# 1 use case
im,d=new(1800,1000)
d.text((900,40),'车鉴 CarLens 用例图',font=font(34,True),fill=NAVY,anchor='ma')
d.rounded_rectangle([430,110,1370,930],radius=18,outline=LINE,width=3)
d.text((900,130),'系统边界',font=font(22),fill=TEXT,anchor='ma')
actor(d,210,300,'访客')
actor(d,210,560,'登录用户')
actor(d,1590,430,'运营管理员')
uc=[(520,190,780,290,'浏览车型/海报'),(520,330,780,430,'配置器试算'),(520,470,780,570,'车型对比/向导'),(820,190,1100,290,'保存配置/报价'),(820,330,1100,430,'下订/模拟支付'),(820,470,1100,570,'订单/试驾'),(1140,190,1350,290,'后台概览'),(1140,330,1350,430,'订单/线索'),(1140,470,1350,570,'车型/门店/新闻')]
for x1,y1,x2,y2,t in uc: ellipse(d,x1,y1,x2,y2,t,20 if len(t)>6 else 23)
# actor lines
for y in [240,380,520]: d.line([248,y,520,y],fill=LINE,width=3)
for y in [240,380,520]: d.line([1100,y,1350,y] if y>300 else [780,y,820,y],fill=LINE,width=3)
# simpler lines to user/admin
d.line([248,560,520,470],fill=LINE,width=3)
d.line([1100,380,1550,380],fill=LINE,width=3)
d.line([1100,520,1550,520],fill=LINE,width=3)
d.line([780,240,820,240],fill=LINE,width=3)
d.line([780,380,820,380],fill=LINE,width=3)
d.text((900,745),'说明：访客以浏览/试算为主；登录用户增加交易与试驾；管理员进入后台。',font=font(22),fill=TEXT,anchor='ma')
im.save(OUT/'usecase.png')

# 2 business flow
im,d=new(1900,900)
d.text((950,35),'配置—报价—下订主流程',font=font(34,True),fill=NAVY,anchor='ma')
steps=[('进入车型',(80,180,330,300)),('选择版本/选装',(390,180,700,300)),('服务端报价',(760,180,1020,300)),('确认配置快照',(1080,180,1380,300)),('填写购车信息',(1440,180,1710,300))]
for t,b in steps: box(d,*b,t)
for i in range(len(steps)-1):
 arrow(d,steps[i][1][2],240,steps[i+1][1][0],240)
# second row
steps2=[('创建订单',(1440,520,1710,640)),('模拟支付',(1080,520,1380,640)),('订单状态',(760,520,1020,640)),('后台处理',(390,520,700,640)),('完成/取消',(80,520,330,640))]
for t,b in steps2: box(d,*b,t)
arrow(d,1575,300,1575,520)
for i in range(len(steps2)-1):
 arrow(d,steps2[i][1][0],580,steps2[i+1][1][2],580)
diamond(d,690,240,160,100,'选项合法?',fill='#FFF8E8')
diamond(d,690,580,160,100,'支付成功?',fill='#FFF8E8')
d.text((690,690),'否：返回配置器',font=font(19),fill='#9A5A17',anchor='ma')
im.save(OUT/'flow.png')

# 3 function modules
im,d=new(1800,1000)
d.text((900,35),'系统功能模块',font=font(34,True),fill=NAVY,anchor='ma')
box(d,700,100,1100,180,'车鉴 CarLens',fill='#E8F2F7',fb=30)
mods=[('车型目录','品牌筛选/详情/海报',150),('配置器','版本/车漆/轮毂/内饰',530),('报价订单','计价/快照/支付',910),('试驾门店','预约/门店/城市',1290),('用户账户','注册/登录/订单',1670,260)]
xs=[60,390,720,1050,1380,1680]
langs=['车型目录','配置器','报价订单','试驾门店','用户账户','运营后台']
for i,(name,sub) in enumerate([('车型目录','品牌筛选/详情/海报'),('配置器','版本/车漆/轮毂/内饰'),('报价订单','计价/快照/支付'),('试驾门店','预约/门店/城市'),('用户账户','注册/登录/订单'),('运营后台','概览/订单/线索/新闻')]):
    x=60+i*285
    box(d,x,330,x+245,460,name,[sub],fs=20,fb=24)
    d.line([900,180,900,250],fill=LINE,width=3)
    d.line([900,250,x+122,250],fill=LINE,width=3); d.line([x+122,250,x+122,330],fill=LINE,width=3)
im.save(OUT/'modules.png')

# 4 ER simplified
im,d=new(1900,1100)
d.text((950,35),'核心实体关系（简化）',font=font(34,True),fill=NAVY,anchor='ma')
box(d,760,130,1140,250,'models 车型',['id / slug / brand / price_from'],fill='#E8F2F7',fs=20,fb=26)
box(d,350,380,720,520,'trims 版本',['model_id / name / price / rank'],fs=20,fb=26)
box(d,1180,380,1550,520,'model_options 车型选装',['model_id / kind / option_id / price'],fs=20,fb=26)
box(d,350,700,720,840,'paints / wheels',['共享配置字典 / 价格'],fs=20,fb=26)
box(d,1180,700,1550,840,'option_rules 规则',['if_option / min_trim_rank'],fs=20,fb=26)
box(d,760,620,1140,760,'orders 订单',['order_no / config_json / total'],fs=20,fb=26)
box(d,80,700,300,850,'users 用户',['id / email / role'],fs=20,fb=26)
box(d,1600,700,1830,850,'stores 门店',['id / city / address'],fs=20,fb=26)
arrow(d,950,250,600,380); d.text((720,300),'1:N',font=font(19),fill=BLUE)
arrow(d,950,250,1200,380); d.text((1100,300),'1:N',font=font(19),fill=BLUE)
arrow(d,600,520,520,700); d.text((500,600),'N:1',font=font(19),fill=BLUE)
arrow(d,1200,520,1300,700); d.text((1270,600),'N:1',font=font(19),fill=BLUE)
arrow(d,950,520,950,620); d.text((970,565),'1:N',font=font(19),fill=BLUE)
arrow(d,760,700,300,760); d.text((500,730),'N:1',font=font(19),fill=BLUE)
arrow(d,1140,700,1600,760); d.text((1400,730),'N:1',font=font(19),fill=BLUE)
im.save(OUT/'er.png')

# 5 deployment
im,d=new(1800,950)
d.text((900,35),'部署拓扑',font=font(34,True),fill=NAVY,anchor='ma')
box(d,60,210,360,400,'浏览器',['桌面/移动','Vue SPA'],fs=18,fb=24)
box(d,460,180,820,420,'Cloudflare Tunnel',['HTTPS / 访问入口','证书终止'],fs=18,fb=24)
box(d,920,150,1280,440,'nginx',['/  → /var/www/wangshu','/api/ → 127.0.0.1:3100','安全响应头 / 缓存'],fs=18,fb=24)
box(d,1380,150,1740,300,'静态资源',['assets / images / s7.glb'],fs=18,fb=24)
box(d,1380,360,1740,520,'Fastify API',['systemd / Node 24','Zod / Drizzle'],fs=18,fb=24)
box(d,920,650,1280,820,'SQLite 数据库',['/opt/wangshu/data','迁移 / 备份'],fs=18,fb=24)
box(d,460,650,820,820,'运维',['deploy-ip.sh','health / 清单清理'],fs=18,fb=24)
for a in [(360,300,460,300),(820,300,920,300),(1280,220,1380,220),(1280,440,1380,440),(1280,300,1380,420),(1280,700,920,700)]:
 arrow(d,*a)
arrow(d,1740,300,1740,360)
im.save(OUT/'deployment.png')

# 6 paint pipeline
im,d=new(1900,950)
d.text((950,35),'换色海报处理流水线',font=font(34,True),fill=NAVY,anchor='ma')
items=[('官方基准海报',150),('mask 制作',360),('Lab 域重映射',570),('WebP q93 导出',780),('指标验收',990),('DB 入库',1200),('2D 配置器',1410)]
for t,x in items:
 box(d,x,240,x+180,390,t,['1600×1000','sRGB'],fs=17,fb=22)
for i in range(len(items)-1): arrow(d,items[i][1]+180,315,items[i+1][1],315)
box(d,500,620,1000,780,'验收门槛',['非漆面 MAE < 1.2 / P99 < 5','同车型五色一致 / 人工复核'],fill='#E8F2F7',fs=20,fb=26)
arrow(d,690,620,690,390)
d.text((950,500),'未通过：回查 mask / 颜色参数',font=font(19),fill='#9A5A17',anchor='ma')
im.save(OUT/'paint-pipeline.png')
print('figures done')
