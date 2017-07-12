# Must be imported once the db object is created
from init import db


class Entity(db.Document):
    """The corresponding collection is named 'entity' """
    name = db.StringField(required=True)
    image_url = db.StringField()
    # Social networks accounts
    accounts = db.DictField()

    infos = db.DynamicField()
    links = db.DictField()

    def __unicode__(self):
        return self.name

    meta = {
        'indexes': ['name']
    }


class Box(db.EmbeddedDocument):
    x = db.FloatField(required=True, null=False)
    y = db.FloatField(required=True, null=False)
    w = db.FloatField(required=True, null=False)
    h = db.FloatField(required=True, null=False)
    timestamp = db.FloatField(required=True, null=False)


class Track(db.EmbeddedDocument):
    start = db.FloatField(required=True, null=False)
    end = db.FloatField()
    boxes = db.EmbeddedDocumentListField(Box, required=True)
    entity = db.ReferenceField(Entity)


class Video(db.Document):
    title = db.StringField(required=True, null=False)
    tracks = db.EmbeddedDocumentListField(Track)
    features = db.DynamicField()
    cuts = db.DynamicField()

    def __unicode__(self):
        return self.title


class SourceVideo(db.Document):
    source_url = db.StringField(required=True)
    reminiz_video = db.ReferenceField(Video, reverse_delete_rule=db.NULLIFY)
    offsets = db.DynamicField()
    hash = db.StringField(required=True)
    # Mongoengine will otherwise name the collection source_videos
    meta = {'collection': 'sourcevideo'}
