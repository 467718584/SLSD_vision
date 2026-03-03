"""
模板加载器 - 简单的HTML模板加载和渲染
"""
import os
from config import BASE_DIR

TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')


def load_template(template_name):
    """加载HTML模板文件"""
    template_path = os.path.join(TEMPLATES_DIR, template_name)
    if not os.path.exists(template_path):
        return ""
    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()


def render_nav_header():
    """渲染导航栏HTML"""
    return load_template('nav_header.html')


def render_dataset_list_html(datasets, search_query, filter_type, algo_types, total_samples):
    """渲染数据集列表HTML"""
    template = load_template('dataset_list.html')

    # 准备筛选按钮HTML
    filter_btns = ''
    for t in algo_types:
        active = 'active' if t == filter_type else ''
        filter_btns += f'<button class="filter-btn {active}" data-type="{t}">{t}</button>'

    # 准备数据行HTML
    rows_html = ''
    colors_list = ['#1462A8', '#E8631A', '#2E8B57', '#8E44AD', '#C0392B']

    for idx, ds in enumerate(datasets):
        algo_type = ds.get('algo_type', '')
        labels = ds.get('labels', {})
        ds_id = ds.get('id', idx + 1)

        # 生成标签HTML
        labels_html = '<br>'.join([f"{k}: {v}" for k, v in labels.items()]) if labels else '-'

        # 生成迷你组件
        import random
        random.seed(ds_id * 7)
        cells = 6
        heatmap_svg = _generate_heatmap_svg(ds_id * 7, 50)

        random.seed(ds_id * 11)
        dist_svg = _generate_dist_svg(ds_id * 11, 50)

        preview_grid = _generate_preview_grid(ds_id, 8, algo_type)

        rows_html += f'''
        <tr onclick="showDatasetDetail('{ds.get('name', '')}')">
            <td style="text-align:center;"><span class="id-num">{ds_id}</span></td>
            <td style="text-align:center;"><span class="tag" style="{get_tag_style(algo_type)}">{algo_type}</span></td>
            <td><div class="name-cell" title="{ds.get('name', '')}">{ds.get('name', '')}</div></td>
            <td style="text-align:center;"><span class="tag-split">{ds.get('split', '-')}</span></td>
            <td style="text-align:center;"><span class="num-cell">{ds.get('total', 0):,}</span></td>
            <td style="text-align:center;"><div class="mini-viz">{heatmap_svg}</div></td>
            <td style="text-align:center;"><div class="mini-viz">{dist_svg}</div></td>
            <td style="text-align:center;"><span class="tag-count">{ds.get('label_count', 0)}</span></td>
            <td><div class="labels-cell">{labels_html}</div></td>
            <td>{preview_grid}</td>
            <td><div class="desc-cell">{ds.get('description', '')}</div></td>
            <td style="text-align:center;">{ds.get('maintain_date', '-')}</td>
            <td style="text-align:center;">{ds.get('maintainer', '-')}</td>
        </tr>
        '''

    # 替换模板变量
    html = template
    html = html.replace('{{search_query}}', search_query)
    html = html.replace('{{filter_btns}}', filter_btns)
    html = html.replace('{{dataset_count}}', str(len(datasets)))
    html = html.replace('{{total_samples}}', f'{total_samples:,}')
    html = html.replace('{{filter_count}}', str(len(datasets)))
    html = html.replace('{{dataset_rows}}', rows_html)

    return html


def render_model_list_html(models, search_query, filter_name, algo_names):
    """渲染模型列表HTML"""
    template = load_template('model_list.html')

    # 准备筛选按钮HTML
    filter_btns = ''
    for name in algo_names:
        active = 'active' if name == filter_name else ''
        filter_btns += f'<button class="filter-btn {active}" data-name="{name}">{name}</button>'

    # 准备数据行HTML
    rows_html = ''

    for idx, m in enumerate(models):
        algo_name = m.get('algo_name', '')
        category = m.get('category', '')
        accuracy = m.get('accuracy', 0)
        m_id = m.get('id', idx + 1)

        # 精度条
        acc_style = get_accuracy_style(accuracy)
        accuracy_html = f'''
        <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:60px;height:6px;background:#E8F0F5;border-radius:3px;overflow:hidden;">
                <div style="width:{accuracy}%;height:100%;background:{acc_style['color']};border-radius:3px;"></div>
            </div>
            <span style="font-size:13px;font-weight:700;color:{acc_style['color']};min-width:40px;">{accuracy:.1f}%</span>
        </div>
        '''

        # 曲线
        curve_colors = ["#1462A8", "#E8631A", "#2E8B57", "#8E44AD", "#C0392B", "#1462A8"]
        curve_names = ["P", "R", "PR", "F1", "CM", "Loss"]
        curves_html = '<div style="display:flex;gap:4px;align-items:center;">'
        for i in range(6):
            curve_svg = _generate_curve_svg(m_id * 7 + i, 36, curve_colors[i])
            curves_html += f'<div style="text-align:center;"><div style="display:flex;justify-content:center;">{curve_svg}</div><div style="font-size:9px;color:#9EAFBE;margin-top:2px;">{curve_names[i]}</div></div>'
        curves_html += '</div>'

        # 预览网格
        preview_grid = _generate_preview_grid(m_id * 3, 8, algo_name)

        rows_html += f'''
        <tr onclick="showModelDetail('{m.get('name', '')}')">
            <td style="text-align:center;"><span class="id-num">{m_id}</span></td>
            <td style="text-align:center;"><span class="tag" style="{get_tag_style(algo_name)}">{algo_name}</span></td>
            <td><div class="name-cell" title="{m.get('name', '')}">{m.get('name', '')}</div></td>
            <td style="text-align:center;"><span class="tag" style="{get_tag_style(category, True)}">{category[:18] if category else '-'}</span></td>
            <td>{accuracy_html}</td>
            <td>{curves_html}</td>
            <td>{preview_grid}</td>
            <td><div class="desc-cell">{m.get('description', '')}</div></td>
            <td><span class="dataset-link">{m.get('dataset', '-')}</span></td>
            <td style="text-align:center;">{m.get('maintain_date', '-')}</td>
            <td style="text-align:center;">{m.get('maintainer', '-')}</td>
        </tr>
        '''

    # 替换模板变量
    html = template
    html = html.replace('{{search_query}}', search_query)
    html = html.replace('{{filter_btns}}', filter_btns)
    html = html.replace('{{model_count}}', str(len(models)))
    html = html.replace('{{filter_count}}', str(len(models)))
    html = html.replace('{{model_rows}}', rows_html)

    return html


def get_tag_style(algo_type, is_model=False):
    """获取标签样式"""
    ALGO_COLORS = {
        "路面积水检测": {"bg": "#EBF3FC", "bd": "#BFDBF7", "text": "#1462A8"},
        "漂浮物检测": {"bg": "#E8F5EE", "bd": "#A8D5C0", "text": "#2E8B57"},
        "墙面裂缝检测": {"bg": "#FEF5E7", "bd": "#F9D9B0", "text": "#E67E22"},
        "游泳检测": {"bg": "#FDE9E9", "bd": "#F5BCBC", "text": "#C0392B"},
        "水面分割": {"bg": "#E8F4FE", "bd": "#A8D0F5", "text": "#0A4D8C"},
        "火焰烟雾检测": {"bg": "#FEF3E7", "bd": "#F5D5A8", "text": "#B45309"},
        "车辆检测": {"bg": "#F3E8FF", "bd": "#D5C4F5", "text": "#7C3AED"},
        "车牌检测": {"bg": "#E0F2FE", "bd": "#A8D9F5", "text": "#0369A1"},
        "安全帽检测": {"bg": "#ECFDF5", "bd": "#A7F3D0", "text": "#059669"},
    }

    MODEL_CAT_COLORS = {
        "多标签实例分割模型": {"bg": "#EBF3FC", "bd": "#BFDBF7", "text": "#1462A8"},
        "单标签实例分割模型": {"bg": "#E8F5EE", "bd": "#A8D5C0", "text": "#2E8B57"},
        "单标签目标检测模型": {"bg": "#FDF0E7", "bd": "#F5C8A8", "text": "#E8631A"},
        "分割模型": {"bg": "#F3E8FF", "bd": "#D5C4F5", "text": "#7C3AED"},
    }

    colors = (MODEL_CAT_COLORS if is_model else ALGO_COLORS).get(
        algo_type,
        {"bg": "#F4F7FA", "bd": "#D8E4EE", "text": "#3D5166"}
    )
    return f"background:{colors['bg']};border:1px solid {colors['bd']};color:{colors['text']};"


def get_accuracy_style(accuracy):
    """获取精度样式"""
    if accuracy >= 95:
        return {"color": "#2E8B57", "level": "high"}
    elif accuracy >= 85:
        return {"color": "#1462A8", "level": "medium"}
    else:
        return {"color": "#E67E22", "level": "low"}


def _generate_heatmap_svg(seed, size=50):
    """生成热力图SVG"""
    import random
    random.seed(seed)
    cells = 6
    s = size
    rects = ""
    for r in range(cells):
        for c in range(cells):
            v = abs(random.random())
            intensity = int(v * 200)
            fill = "#1462A8" if r == c else f"rgb({255 - int(intensity * 0.3)},{255 - int(intensity * 0.6)},255)"
            opacity = 0.85 if r == c else 0.4 + v * 0.5
            rects += f'<rect x="{c * (s/cells)}" y="{r * (s/cells)}" width="{s/cells - 0.5}" height="{s/cells - 0.5}" fill="{fill}" opacity="{opacity}"/>'
    return f'<svg width="{size}" height="{size}" style="border-radius:3px;flex-shrink:0">{rects}</svg>'


def _generate_dist_svg(seed, size=50):
    """生成分布图SVG"""
    import random
    random.seed(seed)
    bars = 8
    heights = [max(0.12, random.random() * 0.85 + 0.15) for _ in range(bars)]
    s = size
    rects = f'<rect width="{s}" height="{s}" fill="#F0F7FF" rx="2"/>'
    bw = s / bars - 1
    for i, h in enumerate(heights):
        bh = h * (s - 6)
        rects += f'<rect x="{i * (s/bars) + 0.5}" y="{s - bh - 3}" width="{bw}" height="{bh}" fill="#1462A8" opacity="{0.55 + i * 0.05}" rx="1"/>'
    return f'<svg width="{size}" height="{size}" style="border-radius:3px;flex-shrink:0">{rects}</svg>'


def _generate_curve_svg(seed, size=36, color="#1462A8"):
    """生成曲线SVG"""
    import random
    random.seed(seed)
    pts = [min(0.98, max(0.1, random.random())) for _ in range(10)]
    w, h = size, size - 4
    coords = " ".join([f"{(i/(len(pts)-1))*(w-4)+2},{h-pts[i]*(h-4)+2}" for i in range(len(pts))])
    return f'<svg width="{size}" height="{size}" style="border-radius:3px;flex-shrink:0"><rect width="{size}" height="{size}" fill="#F4F8FC" rx="2"/><polyline points="{coords}" fill="none" stroke="{color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def _generate_preview_grid(seed, count=8, algo_type=""):
    """生成预览网格"""
    import random
    random.seed(seed)

    algo_colors = {
        "路面积水检测": "#1462A8",
        "漂浮物检测": "#2E8B57",
        "墙面裂缝检测": "#E67E22",
        "游泳检测": "#C0392B",
    }
    algo_color = algo_colors.get(algo_type, "#1462A8")

    items = ""
    for i in range(min(count, 8)):
        has_box = random.random() > 0.1
        hue = 205 + (seed + i * 7) % 40
        lightness = 84 - i
        bg = f"hsl({hue},{28 + i % 12}% ,{lightness}%)"
        box_html = f'<div style="position:absolute;left:15%;top:10%;width:55%;height:65%;border:1.5px solid {algo_color};border-radius:1px;opacity:0.85"></div>' if has_box else ""
        items += f'<div style="width:26px;height:19px;background:{bg};border-radius:2px;position:relative;overflow:hidden;border:1px solid #D8E4EE;flex-shrink:0">{box_html}</div>'
    return f'<div style="display:flex;flex-wrap:wrap;gap:2px">{items}</div>'
