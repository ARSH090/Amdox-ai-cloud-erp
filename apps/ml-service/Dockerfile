FROM python:3.13-slim AS builder
WORKDIR /app
COPY apps/ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
FROM gcr.io/distroless/python3-debian12 AS production
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY apps/ml-service/app ./app
CMD ["app/main.py"]
