import re
import os
import time
import json


import urllib.request
from difflib import SequenceMatcher


# taglist = []
# for page in range(1):
#     try:
#         # https://e621.net/tags.json?limit=320&search[order]=count&page=0
#         d = {
#             'limit': 320, #How many tags you want to retrieve.
#             'page': page, #The page number.
#             'search[order]': 'count'
#         }
#         url = 'https://e621.net/tags.json?'+urllib.parse.urlencode(d)
#         req = urllib.request.Request(
#             url,
#             headers={
#                 'User-Agent': 'Trying to see if I can write autocomplete of my own.'
#             }
#         )
#         print(url)
#         response = urllib.request.urlopen(req)
#     except urllib.error.HTTPError as e:
#         # Return code error (e.g. 404, 501, ...)
#         print(f' HTTPError: {e.code}')
#     except urllib.error.URLError as e:
#         # Not an HTTP-specific error (e.g. connection refused)
#         print(f' URLError: {e.reason}')
#
#     taglist += json.loads(response.read())
#     time.sleep(3)
#
# with open('taglist.txt', 'w+') as file:
#     file.write(json.dumps(taglist, indent=4))

with open('tags-2022-02-05.csv', encoding="utf-8") as file:
    out = file.read().split('\n')[1:-1]
    print(len(out))
    out = [tag for tag in out if tag[-2:] != ',0']
    out = [tag for tag in out if tag[-2:] != ',1']
    print(len(out))
    out = [tag.split(',') for tag in out]
    out = [tag[1:] for tag in out]
    for i in range(len(out)):
        out[i][1] = int(out[i][1])
        out[i][2] = int(out[i][2])
    out.sort(key = lambda x: x[-1], reverse = True)
    out = [tag[:-1] for tag in out]


with open('taglist.json', 'w+', encoding="utf-8") as file:
    file.write('const TAGS621=')
    file.write(json.dumps(out, separators=(',', ':')))
