#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/SLSD_vision')
from modules.database import get_all_models
import json

m = get_all_models()[0]
keys = [k for k in m.keys() if 'version' in k.lower()]
print("Keys with 'version':", keys)
print("version_count value:", m.get('version_count'))
