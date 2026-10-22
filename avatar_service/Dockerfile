FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 HF_HOME=/hf
WORKDIR /srv
COPY requirements.txt .
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
COPY . .
RUN useradd -m app && mkdir -p /hf && chown -R app /srv /hf
USER app
EXPOSE 8003
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8003"]
