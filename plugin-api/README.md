# NodeJS API

## Initialiser la base de données pour les tests

```Shell 
cd test_dev
python manage.py runserver
```
Puis accéder à la page `host:5000/init`



## Tester le recalage

- On teste sur Suicide Squad : une version avec décalages, et l'autre sans.

```Shell
bash init.sh ID_ORIGINAL_VIDEO
```


## Créer le certificat et la clef pour HTTPS

[Source](https://docs.nodejitsu.com/articles/HTTP/servers/how-to-create-a-HTTPS-server/)

```Shell
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```


```Javascript
var options = {
    key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(8000);                                                                                                                                                                                                                                
```
