# Interface Python pour MongoDB

- Permet de charger des videos en DB depuis leur fichier timecode.
- Reinitialise la DB pour les exemples.

Attention aux modèles :  si ils sont modifiés l'API pourrait planter. 

## Usage

```Shell
python manage.py runserver
```
Go to `localhost:5000/init`, it will reset the DB then populate it with the data it gets from
```
/disk2/antoine/data_plugin/*
```
Each dir must contain the following files:
```
/disk2/antoine/data_plugin/*/timecode.txt
/disk2/antoine/data_plugin/*/URL.txt
```
- `timecode.txt` contains the timecodes with boxes coordinates.
- `URL.txt` contains the URL of the source video.




## Image URLs


