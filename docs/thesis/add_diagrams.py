# -*- coding: utf-8 -*-
import importlib.util
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

ROOT = Path('/home/user/projects/wangshu')
SRC = ROOT/'docs/thesis/车鉴CarLens-毕业论文-初稿.docx'
OUT = ROOT/'docs/thesis/车鉴CarLens-毕业论文-完整版.docx'
spec=importlib.util.spec_from_file_location('sup', ROOT/'docs/thesis/build_supplement.py')
sup=importlib.util.module_from_spec(spec); spec.loader.exec_module(sup)

doc=Document(str(SRC))

def set_font(run,name='宋体',size=12,bold=False):
    run.font.name='Times New Roman'; run.font.size=Pt(size); run.bold=bold
    rPr=run._element.get_or_add_rPr(); rf=rPr.find(qn('w:rFonts'))
    if rf is None:
        rf=__import__('docx').oxml.OxmlElement('w:rFonts'); rPr.append(rf)
    rf.set(qn('w:ascii'),'Times New Roman'); rf.set(qn('w:hAnsi'),'Times New Roman'); rf.set(qn('w:eastAsia'),name)

def make_item(item):
    kind=item[0]
    if kind=='fig':
        p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before=Pt(6); p.paragraph_format.space_after=Pt(0)
        r=p.add_run(); r.add_picture(str(ROOT/'docs/thesis'/item[1]), width=Cm(float(item[3])))
        p2=doc.add_paragraph(); p2.alignment=WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before=Pt(3); p2.paragraph_format.space_after=Pt(6)
        r=p2.add_run(item[2]); set_font(r,'宋体',10.5)
        return [p,p2]
    p=doc.add_paragraph()
    if kind=='h2':
        p.style=doc.styles['Heading 2']; r=p.add_run(item[1]); set_font(r,'黑体',15,True)
        p.paragraph_format.space_before=Pt(9); p.paragraph_format.space_after=Pt(9); p.paragraph_format.line_spacing=1.25
    else:
        p.style=doc.styles['Normal']; r=p.add_run(item[1]); set_font(r,'宋体',12)
        p.paragraph_format.first_line_indent=Pt(24); p.paragraph_format.line_spacing=1.25
        p.paragraph_format.space_before=Pt(0); p.paragraph_format.space_after=Pt(0)
        p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    return [p]

def before(target, items):
    for item in items:
        for p in make_item(item):
            target._p.addprevious(p._p)

def after(anchor, items):
    cur=target=anchor
    for item in items:
        for p in make_item(item):
            cur._p.addnext(p._p); cur=p

def find(sub, style=None):
    for p in doc.paragraphs:
        if sub in p.text and (style is None or p.style.name==style):
            return p
    raise SystemExit('not found: '+sub)

# 3.6 用例与业务流程 before old 3.6 summary
old_sum=find('3.6  本章小结')
before(old_sum, sup.CH3_EXTRA)
old_sum.text='3.7  本章小结'

# 4.2 functional module after architecture caption
cap=find('图 4-1  系统总体架构')
after(cap, sup.CH4_MODULE)

# 4.3 ER before 4.3 heading
h43=find('4.3  计价模型设计')
before(h43, sup.CH4_ER)

# 4.7 deployment before old 4.7 summary
old47=find('4.7  本章小结')
before(old47, sup.CH4_DEPLOY)
old47.text='4.8  本章小结'

# 5.5 paint pipeline after first paint paragraph
paintp=find('2D 换色图的制作没有采用生成式整图重绘')
after(paintp, sup.CH5_PIPE)

doc.save(str(OUT))
print('saved',OUT,OUT.stat().st_size)
print('inline',len(doc.inline_shapes),'tables',len(doc.tables),'paras',len(doc.paragraphs))
