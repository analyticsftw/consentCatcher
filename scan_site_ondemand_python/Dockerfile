FROM mcr.microsoft.com/playwright/python:v1.39.0-focal

# WORKDIR /app
COPY requirements.txt ./
# COPY credentials.json ./
COPY main.py ./
# RUN mkdir /app/pw-browsers
RUN pwd
RUN python -m pip install --upgrade pip
RUN pip3 install -r requirements.txt
# RUN ["/bin/bash", "-c", "playwright install"]
# RUN apt-get install chromium
# RUN pip3 install playwright==1.30.0
# RUN PLAYWRIGHT_BROWSERS_PATH=./pw-browsers python -m playwright install
# RUN PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers python main.py
# RUN python -m playwright install
# RUN playwright install
# CMD [ "PLAYWRIGHT_BROWSERS_PATH=/pw-browsers python main.py" ]
# RUN dir -s
ENTRYPOINT ["python3", "main.py"]