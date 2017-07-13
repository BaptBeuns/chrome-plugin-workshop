from tqdm import tqdm
import urllib
import subprocess
import requests
from StringIO import StringIO
from lxml import etree, html
import pandas

file_path = "flagged.csv"
csv = pandas.read_csv(file_path)

df = pandas.DataFrame(columns=csv.columns)

def make_soup(url):
  parser = etree.HTMLParser(encoding='utf8')
  tree   = etree.parse(url, parser)

  return tree

def simili(word):
  try:
    tree = make_soup("http://www.thesaurus.com/browse/" + urllib.quote_plus(word))
    return tree.xpath("//div[@id='synonyms-0']//a[@data-category='{\"name\": \"relevant-3\", \"color\": \"#fcbb45\"}']//span[@class='text']/text()")
  except:
    return []

i = 0

for index, row in tqdm(csv.iterrows(), total=len(csv)):
  word = row['Flag Word']
  flag = row['Possible Rating']
  df.loc[i] = [word, row['Reference category'], row['Possible Rating'], row['Extra Comments']]
  i += 1
  for w in simili(word):
    df.loc[i] = [w, row['Reference category'], row['Possible Rating'], row['Extra Comments']]
    i += 1

df.to_csv("flagged_augmented.csv", index=False)
