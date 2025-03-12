`En-.fun-article.ogg` audio file was obtained from https://en.wikipedia.org/wiki/File:En-.fun-article.ogg on Feb 24, 2025.
<a href="https://commons.wikimedia.org/wiki/File:En-.fun-article.ogg">Speaker: Clay2004Authors of the article</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>, via Wikimedia Commons

It was then converted into .wav and split into 1 second chunks using ffmpeg using the following command:
```
ffmpeg  -i En-.fun-article.ogg -f segment -segment_time 1 ./chunked/chunk_%03d.wav
```
