import subprocess
import shutil

def check_latex_availability():
    """
    Проверяет, установлен ли xelatex и доступен ли он в PATH.
    """
    path = shutil.which("xelatex")
    if path:
        try:
            # Пробуем узнать версию
            result = subprocess.run(["xelatex", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            return True, f"Found XeLaTeX at {path}: {result.stdout.splitlines()[0]}"
        except Exception as e:
            return False, f"Error running XeLaTeX: {e}"
    return False, "XeLaTeX binary not found in system PATH."