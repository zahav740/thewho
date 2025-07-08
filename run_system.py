#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Запуск системы управления производством v11.0
"""

import subprocess
import sys
import os

def run_production_system():
    """Запуск системы производства"""
    print("🚀 Запускаем систему управления производством v11.0...")
    
    # Путь к скрипту
    script_path = os.path.join(os.path.dirname(__file__), "advanced_oee_kpi_v11.py")
    
    try:
        # Запускаем скрипт
        result = subprocess.run([sys.executable, script_path], 
                              capture_output=True, 
                              text=True, 
                              encoding='utf-8')
        
        print("📊 Вывод программы:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️ Предупреждения:")
            print(result.stderr)
            
        if result.returncode == 0:
            print("✅ Система успешно создана!")
        else:
            print(f"❌ Ошибка выполнения (код: {result.returncode})")
            
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")

if __name__ == "__main__":
    run_production_system()
