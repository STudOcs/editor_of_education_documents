# app/services/compiler_services.py
import subprocess
import tempfile
import os
import shutil
import sys
import platform
from pathlib import Path
from typing import Tuple, Optional, List
import re  # <-- ДОБАВИТЬ ЭТО!
import logging
import uuid

logger = logging.getLogger(__name__)

class CompilerService:
    """Сервис для компиляции LaTeX в PDF"""
    
    @staticmethod
    def _get_safe_temp_dir() -> Path:
        """
        Создает безопасную временную директорию без проблемных символов.
        Работает как в Windows, так и в Docker/Linux.
        """
        if platform.system() == "Windows":
            # На Windows избегаем путей с ~
            temp_parent = Path("C:/Temp/latex_temp")
            if not temp_parent.exists():
                # Альтернатива: рабочий стол
                temp_parent = Path.home() / "Desktop" / "latex_temp"
        else:
            # В Docker/Linux используем /tmp
            temp_parent = Path("/tmp") / "latex_temp"
        
        temp_parent.mkdir(exist_ok=True, parents=True)
        
        temp_dir = temp_parent / str(uuid.uuid4())[:8]
        temp_dir.mkdir(exist_ok=True)
        
        logger.debug(f"Создана временная директория: {temp_dir}")
        return temp_dir
    
    @staticmethod
    def verify_compiler_available(compiler: str = "xelatex") -> Tuple[bool, str]:
        """Проверяет доступность компилятора LaTeX."""
        if platform.system() == "Windows":
            compiler_cmd = f"{compiler}.exe"
        else:
            compiler_cmd = compiler
        
        try:
            result = subprocess.run(
                [compiler_cmd, "--version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5,
                shell=True  # Для Windows нужен shell=True
            )
            
            if result.returncode == 0:
                version_line = result.stdout.split('\n')[0] if result.stdout else "unknown"
                return True, f"TeX Live {compiler}: {version_line[:80]}"
            else:
                return False, f"Компилятор не работает: {result.stderr[:100]}"
                
        except FileNotFoundError:
            return False, f"Компилятор '{compiler}' не найден."
        except subprocess.TimeoutExpired:
            return False, "Проверка превысила время ожидания"
        except Exception as e:
            return False, f"Ошибка: {str(e)}"
    
    @staticmethod
    def _wrap_latex_with_russian_support(latex_content: str) -> str:
        """
        Оборачивает LaTeX контент в минимальный документ с поддержкой русского языка.
        Если документ уже содержит \documentclass, оставляем как есть.
        """
        # Проверяем, есть ли уже \documentclass в контенте
        if "\\documentclass" in latex_content:
            # Проверяем, есть ли уже поддержка русского
            if "\\usepackage[english,russian]{babel}" in latex_content or \
               "\\usepackage{polyglossia}" in latex_content or \
               "\\usepackage[utf8]{inputenc}" in latex_content:
                return latex_content
            else:
                # Вставляем поддержку русского после \documentclass
                lines = latex_content.split('\n')
                result_lines = []
                documentclass_added = False
                russian_support_added = False
                
                for line in lines:
                    result_lines.append(line)
                    if "\\documentclass" in line and not documentclass_added:
                        # Добавляем поддержку русского после \documentclass
                        result_lines.extend([
                            "",
                            "% ========== РУССКИЙ ЯЗЫК ==========",
                            "\\usepackage{fontspec}",
                            "\\usepackage{polyglossia}",
                            "\\setmainlanguage{russian}",
                            "\\setotherlanguage{english}",
                            "\\newfontfamily\\russianfont{CMU Serif}",
                            "\\newfontfamily\\russianfonttt{CMU Typewriter Text}",
                            "\\newfontfamily\\russianfontsf{CMU Sans Serif}",
                            ""
                        ])
                        documentclass_added = True
                        russian_support_added = True
                
                if not russian_support_added:
                    # Если не нашли где вставить, добавляем в начало
                    return latex_content
                
                return '\n'.join(result_lines)
        else:
            # Если нет \documentclass, создаем минимальный документ
            minimal_template = r"""\documentclass{article}

% ========== РУССКИЙ ЯЗЫК ==========
\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{russian}
\setotherlanguage{english}

% Шрифты из TeX Live (точно есть!)
\newfontfamily\russianfont{CMU Serif}
\newfontfamily\russianfonttt{CMU Typewriter Text}
\newfontfamily\russianfontsf{CMU Sans Serif}

\begin{document}

""" + latex_content + r"""

\end{document}"""
            return minimal_template
    
    @staticmethod
    def compile_latex_to_pdf(
        latex_content: str,
        compiler: str = "xelatex",
        max_runs: int = 2
    ) -> Tuple[Optional[bytes], str]:
        """
        Компилирует LaTeX код в PDF.
        """
        log_output = []
        
        # Проверяем доступность компилятора
        available, message = CompilerService.verify_compiler_available(compiler)
        if not available:
            log_output.append(f"❌ {message}")
            return None, "\n".join(log_output)
        
        log_output.append(f"✅ {message}")
        
        # Добавляем поддержку русского языка
        latex_content_with_russian = CompilerService._wrap_latex_with_russian_support(latex_content)
        
        # Проверяем наличие кириллицы в тексте
        has_cyrillic = bool(re.search('[а-яА-Я]', latex_content))
        if has_cyrillic:
            log_output.append("🔤 Обнаружен русский текст, добавляется поддержка кириллицы")
        
        # Создаем безопасную временную директорию
        temp_dir = CompilerService._get_safe_temp_dir()
        
        try:
            # Создаем .tex файл
            tex_file = temp_dir / "document.tex"
            tex_file.write_text(latex_content_with_russian, encoding='utf-8')
            log_output.append(f"📄 Файл создан: {tex_file}")
            
            # Компилируем (на Windows используем shell=True)
            for i in range(max_runs):
                if platform.system() == "Windows":
                    # Для Windows: используем shell=True и команду как строку
                    cmd_str = f'cd /d "{temp_dir}" && {compiler}.exe -interaction=nonstopmode -halt-on-error -output-directory "{temp_dir}" document.tex'
                    
                    log_output.append(f"=== Запуск {i+1}/{max_runs} ===")
                    
                    try:
                        result = subprocess.run(
                            cmd_str,
                            shell=True,
                            capture_output=True,
                            text=True,
                            encoding='utf-8',
                            timeout=30
                        )
                    except Exception as e:
                        log_output.append(f"💥 Исключение: {str(e)}")
                        return None, "\n".join(log_output)
                else:
                    # Для Linux/Docker
                    cmd = [
                        compiler,
                        "-interaction=nonstopmode",
                        "-halt-on-error",
                        "-output-directory", str(temp_dir),
                        str(tex_file)
                    ]
                    
                    log_output.append(f"=== Запуск {i+1}/{max_runs} ===")
                    
                    try:
                        result = subprocess.run(
                            cmd,
                            cwd=temp_dir,
                            capture_output=True,
                            text=True,
                            encoding='utf-8',
                            timeout=30,
                            shell=False
                        )
                    except Exception as e:
                        log_output.append(f"💥 Исключение: {str(e)}")
                        return None, "\n".join(log_output)
                
                # Логируем вывод
                if result.stdout:
                    for line in result.stdout.split('\n'):
                        if line.strip() and not line.startswith('('):
                            # Фильтруем лишние сообщения
                            if "Overfull" not in line and "Underfull" not in line:
                                log_output.append(f"  {line[:200]}")
                
                if result.stderr:
                    for line in result.stderr.split('\n'):
                        if line.strip():
                            log_output.append(f"  ⚠️ {line[:200]}")
                
                if result.returncode != 0:
                    log_output.append(f"❌ Ошибка компиляции (код: {result.returncode})")
                    if result.stderr:
                        log_output.append(f"Детали: {result.stderr[:500]}")
                    return None, "\n".join(log_output)
            
            # Ищем PDF файл
            pdf_file = temp_dir / "document.pdf"
            if pdf_file.exists():
                pdf_content = pdf_file.read_bytes()
                log_output.append(f"✅ PDF создан: {len(pdf_content)} байт")
                
                return pdf_content, "\n".join(log_output)
            
            # Ищем PDF с другим именем
            pdf_files = list(temp_dir.glob("*.pdf"))
            if pdf_files:
                pdf_content = pdf_files[0].read_bytes()
                log_output.append(f"✅ PDF найден: {pdf_files[0].name}")
                return pdf_content, "\n".join(log_output)
        
        except Exception as e:
            log_output.append(f"💥 Общее исключение: {str(e)}")
            return None, "\n".join(log_output)
        
        finally:
            # Временно оставляем папку для отладки
            pass
        
        log_output.append("❌ PDF не был создан")
        return None, "\n".join(log_output)
    
    @staticmethod
    def validate_latex_content(latex_content: str) -> Tuple[bool, str]:
        """
        УПРОЩЕННАЯ ВАЛИДАЦИЯ LaTeX кода.
        Разрешаем \def, \let, \futurelet, \input, \include.
        Запрещаем только действительно опасные команды.
        """
        if not latex_content or not latex_content.strip():
            return False, "Пустой LaTeX контент"
        
        # Проверяем базовую структуру (если есть \begin{document})
        if "\\begin{document}" in latex_content and "\\end{document}" not in latex_content:
            return False, "Есть \\begin{document} но нет \\end{document}"
        
        # ТОЛЬКО САМЫЕ ОПАСНЫЕ КОМАНДЫ:
        dangerous_patterns = [
            # Выполнение системных команд
            r"\\write18\s*{",
            r"\\immediate\s*\\write18\s*{",
            
            # Прямое выполнение кода через \special
            r"\\special\s*{[^}]*shell[^}]*}",
            r"\\special\s*{[^}]*exec[^}]*}",
            
            # Попытки обхода пути
            r"\\input\s*{[^}]*\.\.\.[^}]*}",
            r"\\include\s*{[^}]*\.\.\.[^}]*}",
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, latex_content, re.IGNORECASE):
                return False, f"Обнаружена опасная команда"
        
        return True, "LaTeX код валиден"
    
    @staticmethod
    def validate_latex_content_minimal(latex_content: str) -> Tuple[bool, str]:
        """
        МИНИМАЛЬНАЯ ВАЛИДАЦИЯ: только проверка непустоты и \write18.
        Для максимальной совместимости.
        """
        if not latex_content or not latex_content.strip():
            return False, "Пустой LaTeX контент"
        
        # Проверяем только максимально опасное
        if "\\write18{" in latex_content:
            return False, "Команда \\write18{...} запрещена"
        
        return True, "LaTeX код валиден"