import sys
import os
from importlib import import_module

_defaults = import_module('algorithm_template')
if 'AOS_ALGORITHMS' in os.environ:
    _algorithms = import_module(os.environ['AOS_ALGORITHMS'])
else:
    _algorithms = _defaults

ALGO_NAMES = [
    'initialize_freelist',
    'allocate_memory',
    'free_memory',
    'initialize_pagemanager_state',
    'on_page_loaded',
    'on_page_freed',
    'handle_pagefault',
    'init_scheduler',
    'admit_process',
    'pick_process',
    'terminate_process'
]

_module = sys.modules[__name__]
for algo in ALGO_NAMES:
    try:
        setattr(_module, algo, getattr(_algorithms, algo))
    except AttributeError:
        setattr(_module, algo, getattr(_defaults, algo))
