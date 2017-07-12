# Module used to init variables to be ready for other imports
from flask import Flask
from flask_mongoengine import MongoEngine

app = Flask(__name__)
app.config["MONGODB_SETTINGS"] = {'DB': "plugin-api"}
app.config["SECRET_KEY"] = "KeepThisS3cr3t"
db = MongoEngine(app)
