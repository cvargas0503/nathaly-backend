"""Task-local Azure CLI; credentials remain in the private task configuration."""
import os
from pathlib import Path
import runpy
import site
import sys

deployment = Path(__file__).resolve().parent.parent
packages = deployment / 'tools' / 'azure'
site.addsitedir(str(packages))
sys.path.insert(0, str(packages))
os.environ['AZURE_CONFIG_DIR'] = str(deployment / 'tools' / 'azure-config')
sys.argv[0] = 'az'
runpy.run_module('azure.cli', run_name='__main__')
