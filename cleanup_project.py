#!/usr/bin/env python3
import os
import shutil

# Путь к проекту
project_path = r"C:\Users\kasuf\Downloads\TheWho\production-crm"

# Файлы и папки которые нужно ОСТАВИТЬ
keep_files = {
    'START-CRM-ENGLISH.bat',
    '.env.prod',
    '.env.production', 
    '.gitignore',
    'README.md',
    'docker-compose.yml',
    'docker-compose.prod.yml'
}

keep_dirs = {
    'frontend',
    'backend', 
    'shared',
    '.git',
    'docker'
}

# Удаляем все остальные файлы в корне
try:
    for item in os.listdir(project_path):
        item_path = os.path.join(project_path, item)
        
        if os.path.isfile(item_path):
            if item not in keep_files:
                print(f"Удаляем файл: {item}")
                os.remove(item_path)
        elif os.path.isdir(item_path):
            if item not in keep_dirs:
                print(f"Удаляем папку: {item}")
                shutil.rmtree(item_path)
    
    print("Очистка завершена успешно!")
    print(f"Остались файлы: {list(keep_files)}")
    print(f"Остались папки: {list(keep_dirs)}")
    
except Exception as e:
    print(f"Ошибка: {e}")
