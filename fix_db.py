import sqlite3
import json

conn = sqlite3.connect('data/vision_platform.db')
cursor = conn.cursor()

# Add missing sources column
try:
    cursor.execute('ALTER TABLE settings ADD COLUMN sources TEXT')
    print('Added sources column')
except Exception as e:
    print(f'Column already exists or error: {e}')

# Check columns
cursor.execute('PRAGMA table_info(settings)')
columns = {row[1] for row in cursor.fetchall()}
print(f'Columns: {columns}')

# Update sources if needed
if 'sources' in columns:
    sources = ["互联网","本地采集","合作伙伴","公开数据集"]
    cursor.execute("UPDATE settings SET sources = ? WHERE id = 1", (json.dumps(sources),))
    print(f'Updated sources')

conn.commit()
conn.close()
print('Done')
