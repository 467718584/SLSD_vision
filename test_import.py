"""测试模板加载"""
import sys
sys.path.insert(0, 'D:/project/SLSD_vision')

# 测试导入
print("Testing imports...")

try:
    from modules.template_renderer import render_nav_header, load_template
    print("OK: template_renderer imported")
except Exception as e:
    print(f"ERROR: template_renderer - {e}")

try:
    from modules.database import init_database, get_all_datasets
    print("OK: database imported")
    init_database()
    datasets = get_all_datasets()
    print(f"OK: Found {len(datasets)} datasets")
except Exception as e:
    print(f"ERROR: database - {e}")

# 测试加载模板
print("\nTesting template loading...")
try:
    nav_html = render_nav_header()
    print(f"OK: nav_header loaded, length: {len(nav_html)}")
except Exception as e:
    print(f"ERROR: nav_header - {e}")

# 测试加载CSS
print("\nTesting CSS loading...")
try:
    style_path = 'D:/project/SLSD_vision/templates/style.html'
    with open(style_path, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"OK: style.html loaded, length: {len(content)}")
except Exception as e:
    print(f"ERROR: style.html - {e}")

print("\nDone!")
