#!/usr/bin/env python3
import json
import pathlib
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path("/Users/artem/Desktop/Heritage Hub")
FLAGS = ROOT / "client/public/flags"
PHOTOS = ROOT / "client/public/photos/oblasts"
UA = "HeritageHub/1.0 (educational catalog of Belarus places)"

FLAG_FILES = {
    "brest.svg": "File:Flag of Brest Voblast, Belarus.svg",
    "vitebsk.svg": "File:Flag of Vitsebsk region.svg",
    "gomel.svg": "File:Flag of Homyel Voblast.svg",
    "grodno.svg": "File:Flag of Hrodna Voblasts.svg",
    "minsk.svg": "File:Flag of Minsk Voblast.svg",
    "mogilev.svg": "File:Flag of Mahilyow Voblast.svg",
}

PHOTOS_WANTED = [
    ("polotsk-monastery.jpg", "Спасо-Евфросиниевский монастырь Полоцк"),
    ("mogilev-embankment.jpg", "Набережная Днепра Могилёв"),
    ("brest-nicholas.jpg", "Николаевская братская церковь Брест"),
    ("berestye-museum.jpg", "Археологический музей Берестье"),
    ("pinsk-butrimovich.jpg", "Дворец Бутримовича Пинск"),
    ("kobrin-suvorov.jpg", "Музей Суворова Кобрин"),
    ("baranovichi-pokrov.jpg", "Покровский собор Барановичи"),
    ("bereza-monastery.jpg", "Картезианский монастырь Береза"),
    ("skoki-manor.jpg", "Усадьба Немцевичей Скоки"),
    ("motol-house.jpg", "Дом-музей Хаима Вейцмана Мотоль"),
    ("vysokoye-trinity.jpg", "Троицкий костёл Высокое"),
    ("orsha-jesuit.jpg", "Иезуитский коллегиум Орша"),
    ("zdravnevo.jpg", "Усадьба Здравнёво Репин"),
    ("glubokoe-carmel.jpg", "Костёл кармелитов Глубокое"),
    ("vitebsk-amphitheater.jpg", "Летний амфитеатр Витебск"),
    ("boris-stone.jpg", "Борисов камень Полоцк"),
    ("vitebsk-annunciation.jpg", "Благовещенская церковь Витебск"),
    ("polotsk-epiphany.jpg", "Богоявленский собор Полоцк"),
    ("pastavy-church.jpg", "Костёл Поставы"),
    ("grodno-new-castle.jpg", "Новый замок Гродно"),
    ("zhirovichi-monastery.jpg", "Жировичский монастырь"),
    ("synkovichi-church.jpg", "Церковь Сынковичи"),
    ("muravanka-church.jpg", "Церковь Мурованка"),
    ("krevo-castle.jpg", "Кревский замок"),
    ("halshany-castle.jpg", "Гольшанский замок"),
    ("novogrudok-hill.jpg", "Замковая гора Новогрудок"),
    ("slonim-synagogue.jpg", "Слонимская синагога"),
    ("svityaz-lake.jpg", "Озеро Свитязь"),
    ("lubcha-castle.jpg", "Любчанский замок"),
    ("zaslavl-church.jpg", "Спасо-Преображенская церковь Заславль"),
    ("stalin-line.jpg", "Линия Сталина музей"),
    ("mound-glory.jpg", "Курган Славы Минск"),
    ("war-museum.jpg", "Музей Великой Отечественной войны Минск"),
    ("holy-spirit.jpg", "Свято-Духов собор Минск"),
    ("island-tears.jpg", "Остров слёз Минск"),
    ("loshitsa.jpg", "Лошицкий парк усадьба"),
    ("narach-lake.jpg", "Озеро Нарочь"),
    ("budslav-church.jpg", "Будславский костёл"),
    ("strochitsy-museum.jpg", "Музей народной архитектуры Строчицы"),
    ("minsk-opera.jpg", "Большой театр оперы и балета Минск"),
    ("zhilichi-palace.jpg", "Дворец Булгаков Жиличи"),
    ("bykhov-castle.jpg", "Быховский замок"),
    ("mstislavl-carmel.jpg", "Костёл кармелитов Мстиславль"),
    ("mogilev-museum.jpg", "Краеведческий музей Могилёв"),
    ("mogilev-nicholas.jpg", "Никольский монастырь Могилёв"),
    ("gorki-academy.jpg", "Сельскохозяйственная академия Горки"),
    ("krichev-palace.jpg", "Дворец Потёмкина Кричев"),
    ("shklov-center.jpg", "Шклов ратуша"),
    ("brest-embankment.jpg", "Набережная Мухавца Брест"),
]

BAD = ("flag", "coat", "map", "locator", "plan", "герб", "флаг", "схема", "icon", "logo", "svg", "stamp", "coin", "postcard", "монет", "медал", "medal", "аверс", "реверс", "банкнот", "banknote")


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                return response.read(), response.headers.get("Content-Type", "")
        except Exception as error:
            wait = 20 if "429" in str(error) else 4
            print("retry", attempt, error)
            time.sleep(wait)
    return b"", ""


def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    raw, _ = get(url)
    if not raw:
        return {}
    return json.loads(raw)


def download_flags():
    titles = "|".join(FLAG_FILES.values())
    data = api({
        "action": "query",
        "titles": titles,
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "format": "json",
    })
    by_title = {}
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        by_title[page.get("title")] = info.get("url")
    for name, title in FLAG_FILES.items():
        url = by_title.get(title)
        if not url:
            print("FLAG MISS", title)
            continue
        body, mime = get(url)
        if b"<svg" not in body[:500] and not body.lstrip().startswith(b"<?xml"):
            print("FLAG BAD", name, mime, len(body))
            continue
        (FLAGS / name).write_bytes(body)
        print("FLAG", name, len(body))
        time.sleep(1.2)


def pick(query):
    data = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": "12",
        "prop": "imageinfo",
        "iiprop": "url|mime|size",
        "iiurlwidth": "1400",
        "format": "json",
    })
    pages = list(data.get("query", {}).get("pages", {}).values())
    pages.sort(key=lambda page: page.get("index", 99))
    for page in pages:
        title = (page.get("title") or "").lower()
        if any(word in title for word in BAD):
            continue
        info = (page.get("imageinfo") or [{}])[0]
        mime = info.get("mime") or ""
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        url = info.get("thumburl") or info.get("url")
        if url:
            return url, mime
    return "", ""


def archive_bytes(url):
    clean = url.split("?")[0]
    import subprocess
    for year in ("2024", "2023", "2021", "2019", "2016"):
        arc = f"https://web.archive.org/web/{year}id_/{clean}"
        try:
            body = subprocess.check_output(
                ["curl", "-fsSL", "--max-time", "35", "-A", UA, arc],
                stderr=subprocess.DEVNULL,
            )
        except subprocess.CalledProcessError:
            time.sleep(0.4)
            continue
        if body[:3] == b"\xff\xd8\xff" or body[:8] == b"\x89PNG\r\n\x1a\n" or body[:4] == b"RIFF":
            return body
    return b""


def download_photos():
    import subprocess
    for name, query in PHOTOS_WANTED:
        target = PHOTOS / name
        if target.exists() and target.stat().st_size > 30000:
            print("KEEP", name, flush=True)
            continue
        url, mime = pick(query)
        time.sleep(0.5)
        if not url:
            print("NONE", name, query, flush=True)
            continue
        body = b""
        if "thumb.wikimedia.org" in url or "upload.wikimedia.org" in url:
            try:
                body = subprocess.check_output(
                    ["curl", "-fsSL", "--max-time", "30", "-A", UA, url],
                    stderr=subprocess.DEVNULL,
                )
            except subprocess.CalledProcessError:
                body = b""
        if len(body) < 20000:
            body = archive_bytes(url)
        if len(body) < 20000:
            print("SMALL", name, len(body), flush=True)
            continue
        if body[:8] == b"\x89PNG\r\n\x1a\n" or body[:4] == b"RIFF":
            raw = target.with_suffix(".bin")
            raw.write_bytes(body)
            subprocess.check_call(["sips", "-s", "format", "jpeg", str(raw), "--out", str(target)], stdout=subprocess.DEVNULL)
            raw.unlink(missing_ok=True)
        else:
            target.write_bytes(body)
        print("OK", name, target.stat().st_size, flush=True)
        time.sleep(0.6)


if __name__ == "__main__":
    download_photos()
    print("DONE", flush=True)
