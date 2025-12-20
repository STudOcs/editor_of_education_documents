FROM python:3.11-slim

# САМЫЙ МИНИМАЛЬНЫЙ LaTeX
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Устанавливаем Python зависимости
WORKDIR /app
COPY requarement.txt .
RUN pip install --no-cache-dir -r requarement.txt

# 3. Копируем код приложения
COPY . .

# 4. Создаем папки для хранения данных
RUN mkdir -p media/documents
RUN mkdir -p storage/pdfs

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]