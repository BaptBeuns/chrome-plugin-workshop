// Création d'un élément pour recouvrir le body, probablement plus utile,
// mais je garde pour la postéritée et le point interressant dessous.
var panel = document.createElement( 'div' );
document.body.appendChild( panel );
panel.id = 'reminiz-plugin-panel';
panel.style.position = 'left';
panel.style.top = '0%';
panel.style.left = '0%';
panel.style.width = '100%';
panel.style.height = '0%';
panel.style.zIndex = '2147483642';

// Ceci est interressant sert à inclure de l'html dans le div.
$("body").attr("ng-app", "ReminizPlugin");

xmlhttp=new XMLHttpRequest();
xmlhttp.open("GET", chrome.extension.getURL('html/panel.html'), false);
xmlhttp.send();
panel.innerHTML = xmlhttp.responseText;

xmlhttp=new XMLHttpRequest();
xmlhttp.open("GET", chrome.extension.getURL('html/list.html'), false);
xmlhttp.send();
panel.innerHTML += xmlhttp.responseText;

// Petites variable globales moches.
var player;
