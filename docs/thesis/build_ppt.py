# -*- coding: utf-8 -*-
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pathlib import Path
from PIL import Image

ROOT = Path('/home/user/projects/wangshu')
OUT = ROOT / 'docs/thesis/车鉴CarLens-答辩PPT.pptx'
NAVY = RGBColor(0x0B,0x17,0x23); BLUE=RGBColor(0x1B,0x6F,0x95); LIGHT=RGBColor(0xF3,0xF7,0xFA)
MUTED=RGBColor(0x5B,0x6A,0x78); WHITE=RGBColor(0xFF,0xFF,0xFF); ACCENT=RGBColor(0x4E,0xB1,0xDD)
FONT='微软雅黑'
prs=Presentation()
prs.slide_width=Inches(13.333); prs.slide_height=Inches(7.5)
blank=prs.slide_layouts[6]

def bg(slide,color):
    fill=slide.background.fill; fill.solid(); fill.fore_color.rgb=color

def text(slide,x,y,w,h,value,size=20,color=NAVY,bold=False,align=PP_ALIGN.LEFT,font=FONT,line=1.1):
    tb=slide.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h)); tf=tb.text_frame
    tf.word_wrap=True; tf.margin_left=0; tf.margin_right=0; tf.margin_top=0; tf.margin_bottom=0
    p=tf.paragraphs[0]; p.alignment=align; p.line_spacing=line
    r=p.add_run(); r.text=value; r.font.size=Pt(size); r.font.bold=bold; r.font.name=font; r.font.color.rgb=color
    return tb

def rect(slide,x,y,w,h,fill,line=None,shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    s=slide.shapes.add_shape(shape,Inches(x),Inches(y),Inches(w),Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb=fill
    if line: s.line.color.rgb=line
    else: s.line.fill.background()
    try:
        s.adjustments[0]=0.08
    except Exception:
        pass
    return s

def header(slide, tag, title, num):
    bg(slide,WHITE)
    rect(slide,0,0,13.333,0.12,BLUE,shape=MSO_SHAPE.RECTANGLE)
    text(slide,0.7,0.35,10.5,0.4,tag,12,ACCENT,True)
    text(slide,0.7,0.75,11.6,0.75,title,30,NAVY,True)
    text(slide,12.0,7.05,0.8,0.3,str(num),10,MUTED,False,PP_ALIGN.RIGHT)

def bullets(slide,x,y,w,h,items,size=18,color=NAVY,space=8):
    tb=slide.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h)); tf=tb.text_frame
    tf.word_wrap=True; tf.margin_left=0; tf.margin_right=0; tf.margin_top=0; tf.margin_bottom=0
    first=True
    for item in items:
        p=tf.paragraphs[0] if first else tf.add_paragraph(); first=False
        p.space_after=Pt(space); p.line_spacing=1.15
        r=p.add_run(); r.text='•  '+item; r.font.size=Pt(size); r.font.name=FONT; r.font.color.rgb=color

def pic(slide,path,x,y,w,h):
    img=Image.open(path); iw,ih=img.size
    scale=min(w/iw,h/ih); dw=iw*scale; dh=ih*scale
    slide.shapes.add_picture(str(path),Inches(x+(w-dw)/2),Inches(y+(h-dh)/2),Inches(dw),Inches(dh))

def notes(slide,value):
    slide.notes_slide.notes_text_frame.text=value

# 1 cover
s=prs.slides.add_slide(blank); bg(s,NAVY)
rect(s,0.8,1.0,0.08,5.4,ACCENT,shape=MSO_SHAPE.RECTANGLE)
text(s,1.25,1.05,10.8,0.4,'广州华立学院 · 2027 届本科毕业设计',13,ACCENT,True)
text(s,1.25,1.65,11.0,1.8,'“车鉴 CarLens”\n多品牌汽车配置聚合与在线报价平台\n的设计与实现',36,WHITE,True,line=1.18)
text(s,1.25,4.25,11.0,0.45,'答辩人：____________    学号：____________',17,RGBColor(0xD9,0xE2,0xEA))
text(s,1.25,4.85,11.0,0.45,'指导教师：高乐  副教授    专业：计算机科学与技术',17,RGBColor(0xD9,0xE2,0xEA))
text(s,1.25,5.55,4.5,0.35,'2027 年 5 月',14,ACCENT)
text(s,10.4,6.65,2.2,0.3,'CarLens',14,ACCENT,True,PP_ALIGN.RIGHT)
notes(s,'各位老师好，我是计算机科学与技术专业的学生，我的毕业设计题目是“车鉴 CarLens”多品牌汽车配置聚合与在线报价平台的设计与实现，指导教师是高乐副教授。下面用 8 分钟汇报选题、设计、实现和测试。')

# 2 agenda
s=prs.slides.add_slide(blank); header(s,'CONTENTS','汇报结构',2)
items=[('01','问题与目标','多品牌信息分散、配置口径不一'),('02','系统设计','架构、数据、计价、3D/2D'),('03','关键实现','目录、配置器、订单、换色'),('04','测试与总结','44 项测试、移动端、局限')]
for i,(n,t,d) in enumerate(items):
    y=1.55+i*1.3
    text(s,0.85,y,0.8,0.6,n,28,ACCENT,True)
    text(s,1.75,y-0.02,3.2,0.5,t,22,NAVY,True)
    text(s,5.1,y+0.02,7.3,0.5,d,16,MUTED)
    if i<3: s.shapes.add_connector(1,Inches(0.95),Inches(y+0.7),Inches(12.2),Inches(y+0.7)).line.color.rgb=RGBColor(0xE1,0xE8,0xEE)
notes(s,'汇报分四部分：先说明问题和目标，再讲系统设计与关键实现，最后给测试结果和总结。')

# 3 background
s=prs.slides.add_slide(blank); header(s,'01  PROBLEM','多品牌选车，信息为什么难比较',3)
bullets(s,0.85,1.65,6.3,4.8,[
'品牌官网各自为战：配置器、选装规则、报价口径不统一',
'同一预算区间跨品牌比较，需要反复切页面、手工算落地价',
'3D 配置器效果依赖逐车建模，成本高；纯海报又缺少配置反馈',
'毕业设计常见系统只做单品牌或只做静态配置表，缺少交易闭环'
],18)
rect(s,7.35,1.55,5.15,4.9,LIGHT)
text(s,7.75,1.85,4.4,0.4,'本课题要回答的三个问题',16,BLUE,True)
text(s,7.75,2.4,4.4,3.6,'① 怎样把不同品牌放进同一套目录？\n\n② 怎样保证配置、税费、保险、落地价一致？\n\n③ 怎样在有限成本下做出 3D/2D 可用的配置体验？',18,NAVY,line=1.25)
notes(s,'背景部分强调三个问题：统一目录、统一计价、可控的展示成本。这也是后面设计的主线。')

# 4 goals
s=prs.slides.add_slide(blank); header(s,'01  GOAL','研究目标与边界',4)
bullets(s,0.85,1.55,5.9,4.8,[
'聚合：10 个品牌、20 款车型、45 个版本、260 条选装关系',
'配置：版本/车漆/轮毂/内饰/选装包联动',
'报价：整数分、服务端重算、配置快照',
'交易：下订、模拟支付、订单状态、幂等',
'展示：共享 3D 模型 + 2D 高清海报 + 换色图',
'保障：限流、CSP、输入校验、移动端适配'
],17)
rect(s,7.0,1.55,5.45,4.9,NAVY)
text(s,7.4,1.9,4.7,0.4,'范围声明',15,ACCENT,True)
text(s,7.4,2.45,4.7,3.5,'价格、库存、门店与支付均为毕业设计演示数据；\n\n支付为模拟网关，不产生真实扣款；\n\n3D 模型仅作选装示意，不代表具体车型的精确还原。',16,WHITE,line=1.25)
notes(s,'目标可以概括为“聚合、配置、报价、交易、展示、保障”六个词，同时明确演示边界，避免把演示数据说成真实交易。')

# 5 architecture
s=prs.slides.add_slide(blank); header(s,'02  DESIGN','总体架构：前后端分离 + 静态资源分离',5)
pic(s,ROOT/'docs/thesis/figures/architecture.png',0.55,1.35,8.2,4.9)
bullets(s,9.05,1.55,3.7,4.8,[
'Vue 3 SPA：路由、状态、组件',
'Fastify 5：REST、Zod、Drizzle',
'SQLite：车型/订单/试驾',
'nginx + Tunnel：HTTPS、缓存、CSP',
'3D/2D 按需加载'
],15)
notes(s,'架构图从浏览器到 nginx、Vue、Fastify 和 SQLite。前后端分离让目录、计价和页面可以独立演进，静态资源分离则便于缓存和 3D 按需加载。')

# 6 data
s=prs.slides.add_slide(blank); header(s,'02  DESIGN','数据模型：把多品牌放进同一套口径',6)
bullets(s,0.85,1.55,5.9,4.9,[
'品牌—车型—版本—配置项—订单',
'车型表保存 brand、segment、range、priceFrom',
'共享车漆/轮毂/内饰/选装包字典',
'model_options 保存车型级价格与可用性',
'option_rules 表达“21 英寸轮毂需高配”',
'model_paint_images 支撑 2D 按颜色换图'
],17)
rect(s,7.05,1.55,5.4,4.9,LIGHT)
text(s,7.45,1.9,4.6,0.4,'当前数据规模',15,BLUE,True)
for i,(n,l) in enumerate([('10','品牌'),('20','车型'),('45','版本'),('260','车型选装关系')]):
    x=7.45+(i%2)*2.55; y=2.45+(i//2)*1.3
    text(s,x,y,1.0,0.5,n,30,BLUE,True)
    text(s,x,y+0.55,1.8,0.35,l,13,MUTED)
notes(s,'数据模型的重点不是表多，而是统一口径。车型、版本和选装关系分开，价格放在车型选装关系里，规则单独表达，订单保存快照。')

# 7 configurator
s=prs.slides.add_slide(blank); header(s,'03  IMPLEMENT','配置器：3D 示意与 2D 海报切换',7)
pic(s,ROOT/'docs/screens/live-multibrand-config.png',0.55,1.35,8.2,4.9)
bullets(s,9.0,1.55,3.8,4.8,[
'Pinia 管理选择状态',
'服务端重算价格',
'共享 s7.glb，材质联动车漆/轮毂',
'2D 模式不加载 three.js 与 GLB',
'弱网/移动端自动回退'
],15)
notes(s,'配置器左侧展示、右侧选择。3D 用共享模型，重点是车漆和轮毂的实时联动；2D 模式不请求 three.js 和 GLB，适合移动端和弱网。')

# 8 pricing
s=prs.slides.add_slide(blank); header(s,'03  IMPLEMENT','报价：所有金额在服务端复算',8)
text(s,0.85,1.45,7.0,0.4,'核心公式',14,BLUE,True)
formulas=['S = 版本 + 车漆 + 轮毂 + 内饰 + 选装包','T_full = round(S / 1.13 × 10%)','T_relief = min(round(T_full × 50%), 1 500 000)','I = roundTo(S × 2.2% + 95 000, 1 000)','Total = S + T_full - T_relief + I + 50 000']
for i,f in enumerate(formulas):
    text(s,0.85,1.95+i*0.55,7.6,0.4,f,17,NAVY,False,line=1.0)
rect(s,8.6,1.55,4.1,3.4,LIGHT)
text(s,8.95,1.85,3.4,0.35,'汉 EV 506km 示例',14,BLUE,True)
text(s,8.95,2.35,3.4,0.5,'¥193,165.75',24,NAVY,True)
text(s,8.95,2.95,3.4,1.6,'裸车 179,800\n购置税 7,779\n保险 4,820\n上牌 500 / 定金 5,000',14,MUTED,line=1.25)
text(s,0.85,5.35,11.6,0.8,'前端只展示，服务端重新读取车型与选装关系后计算；下单时再次复算并保存快照。',15,MUTED)
notes(s,'报价模型是整数分、服务端复算。以汉 EV 默认配置为例，落地价 193,165.75 元。前端不能改价，下单时还会再算一次并保存配置快照。')

# 9 order/security
s=prs.slides.add_slide(blank); header(s,'03  IMPLEMENT','交易链路：幂等、状态机与安全',9)
bullets(s,0.85,1.55,6.0,4.9,[
'订单号：WS + 日期 + 8 位随机十六进制',
'Idempotency-Key：重复提交返回原订单',
'唯一索引兜底并发；不同手机号复用返回 409',
'支付幂等：重复支付不重复写 payments',
'状态：待支付/已支付/已确认/已交付/已取消',
'限流、Cookie 会话、CSP、Zod 校验'
],17)
rect(s,7.0,1.55,5.45,4.9,NAVY)
text(s,7.4,1.9,4.7,0.4,'一次下订的重试路径',14,ACCENT,True)
text(s,7.4,2.4,4.7,3.7,'用户点击\n  ↓\nPOST /orders + Idempotency-Key\n  ↓\n查 key → 已存在 → 校验归属 → 返回原订单\n  ↓\n不存在 → 插入 → 唯一冲突 → 再查 → 返回',15,WHITE,line=1.35)
notes(s,'交易链路重点讲幂等键：网络超时或用户连点时，同一个 key 只会产生一张订单。支付也做了幂等，重复调用不会重复写支付记录。')

# 10 color
s=prs.slides.add_slide(blank); header(s,'03  IMPLEMENT','2D 换色：确定性重映射，而不是整图重绘',10)
pic(s,ROOT/'docs/screens/v3-cachebusted-blue.png',0.55,1.35,7.7,4.6)
bullets(s,8.55,1.55,4.2,4.8,[
'每款车 1 张 mask，5 色共用',
'只重映射漆面亮度/色度',
'mask 外保持不变',
'当前海豹/汉 EV 各 5 色',
'非漆面 MAE 0.93–1.07',
'其余车型回退封面'
],15)
notes(s,'换色没有用生成式整图重绘，而是做 mask 内的确定性 Lab 重映射，避免轮毂、车标和车牌被重画。当前完成海豹和汉 EV 各 5 色，其余车型回退封面。')

# 11 mobile
s=prs.slides.add_slide(blank); header(s,'03  IMPLEMENT','移动端：不是缩放，而是重排',11)
pic(s,ROOT/'docs/screens/mobile-compare-final.png',0.55,1.35,3.5,5.1)
bullets(s,4.55,1.55,4.4,4.9,[
'390/360 宽度专项审计',
'汉堡菜单、单列车型卡',
'轮播隐藏圆点，箭头+计数',
'对比表格改卡片',
'配置器底部价格栏固定',
'海报灯箱自适应'
],16)
rect(s,9.35,1.55,3.1,4.9,LIGHT)
text(s,9.7,1.9,2.5,0.35,'结果',14,BLUE,True)
text(s,9.7,2.35,2.5,2.7,'15 个页面\n390px 无横向溢出\n\n5 个关键页\n360px 复验通过',18,NAVY,line=1.25)
notes(s,'移动端做了专项审计，390 宽度覆盖 15 个页面，360 复验 5 个关键页；发现的问题包括轮播圆点溢出、对比页只能看第一列，都已经修复。')

# 12 tests
s=prs.slides.add_slide(blank); header(s,'04  TEST','测试：44 项 API 测试 + 页面走查',12)
bullets(s,0.85,1.55,5.7,4.9,[
'Vitest：11 个测试文件 / 44 项',
'目录、计价、订单、支付、试驾、认证、后台',
'幂等重放、冲突、过去时间、越权、限流',
'vue-tsc + vite build 通过',
'Puppeteer 桌面/移动端截图走查',
'线上 /api/health 与关键路径验收'
],17)
rect(s,6.65,1.55,5.9,4.9,LIGHT)
text(s,7.0,1.9,5.2,0.35,'关键结果',14,BLUE,True)
for i,(n,l) in enumerate([('44/44','API 测试通过'),('20','车型在售'),('10','品牌聚合'),('0','移动端横向溢出')]):
    x=7.0+(i%2)*2.7; y=2.35+(i//2)*1.35
    text(s,x,y,1.1,0.5,n,26,BLUE,True)
    text(s,x,y+0.55,2.1,0.35,l,12,MUTED)
notes(s,'测试部分只讲结果：44 项 API 测试全部通过，20 款车型和 10 个品牌数据正常，移动端没有横向溢出。')

# 13 innovation/limitations
s=prs.slides.add_slide(blank); header(s,'04  SUMMARY','创新点与不足',13)
text(s,0.85,1.5,5.9,0.4,'主要工作',14,BLUE,True)
bullets(s,0.85,1.95,5.9,4.4,[
'多品牌统一目录与品牌筛选',
'服务端统一计价 + 配置快照',
'共享 3D + 2D 海报降级',
'确定性换色与可复核指标',
'订单幂等与安全加固'
],16)
text(s,7.0,1.5,5.5,0.4,'局限与后续',14,BLUE,True)
bullets(s,7.0,1.95,5.5,4.4,[
'3D 模型全系共用，只作示意',
'换色仅完成 2 款车',
'SQLite/单机，未验证高并发',
'真实支付、库存与金融未接入',
'品牌仍为车型字段，未拆品牌表'
],16)
notes(s,'创新点主要是多品牌统一目录、服务端计价、3D/2D 混合和确定性换色。不足也要主动说：3D 共用模型、换色覆盖少、单机 SQLite、真实交易未接入。')

# 14 end
s=prs.slides.add_slide(blank); bg(s,NAVY)
text(s,1.0,1.5,11.3,0.5,'DEMO & THANKS',14,ACCENT,True)
text(s,1.0,2.1,11.3,1.2,'车鉴 CarLens',44,WHITE,True)
text(s,1.0,3.35,11.3,0.6,'https://ziphare.me/',22,ACCENT)
text(s,1.0,4.35,11.3,0.5,'演示：车型矩阵 → 配置器 → 报价 → 下订 → 模拟支付 → 后台',16,RGBColor(0xD9,0xE2,0xEA))
text(s,1.0,5.6,11.3,0.5,'请各位老师批评指正',18,WHITE,True)
notes(s,'最后给线上地址，演示路径是车型矩阵、配置器、报价、下订、模拟支付和后台。谢谢各位老师。')

prs.save(str(OUT))
print('saved',OUT,OUT.stat().st_size,'slides',len(prs.slides))
