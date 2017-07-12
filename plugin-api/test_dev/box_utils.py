from models import Box, Entity, SourceVideo, Track, Video
import hashlib


def dict_to_db(data_dict, title, index_to_id):
    """Enters the data into the MongoDB.
    Args:
    * data_dict: dict containing annotations for 1 video.
        {
            'url': <url>,
            'tracks': [
                {'faces':[
                    {'time': 0.0, 'box': [1, 2, 3, 4]},
                    {'time': 1.0, 'box': [2, 3, 4, 5]},
                    ...
                 ],
                 'annotation': 'Georges Clooney'
                 }
            ]
        }
    * title : string, title of the movie
    * index_to_id: dict maps from index in the timecode.txt to entity ID
    """
    tracks = []
    for track in data_dict['tracks']:
        ent_id = index_to_id[int(track['annotation'])]
        boxes = []
        for box in sorted(track['faces'], key=lambda x: x['time']):
            boxes.append(Box(timestamp=box['time'],
                             x=box['box'][0], y=box['box'][1], w=box['box'][2], h=box['box'][3]))
        tracks.append(Track(start=boxes[0].timestamp, end=boxes[-1].timestamp,
                            boxes=boxes,
                            entity=ent_id))

    # Create the video
    vid = Video(title=title, tracks=tracks)
    vid.save()
    # Get the hash of the URL (minus the protocol)
    url = data_dict['url'].split('https://www.')[1]
    hasher = hashlib.md5()
    hasher.update(url)
    hash_md5 = hasher.hexdigest()
    SourceVideo(source_url=url, hash=hash_md5, reminiz_video=vid.id).save()


def tracks_at_t(video_name, timestamp):
    """Returns the tracks present at <timestamp> in the video with name <video_name>.
    Args:
    * video_name: str, the name of the video
    * timestamp : float, timestamp in seconds
    """
    # Here we assume the name is unique
    vid = Video.objects(title=video_name).get()
    good_tracks = [t for t in vid.tracks if t.start <= timestamp and t.end >= timestamp]
    return good_tracks


def get_box(track, timestamp):
    """Returns the box to appear at the selected timestamp.
    Boxes are interpolated.
    Args:
    * track    : Track object
    * timestamp: float, timestamp in seconds
    """
    end_box = None
    start_box = track.boxes[0]

    for b in track.boxes:
        if b.timestamp >= timestamp:
            end_box = b
            break
        start_box = b

    # Interpolate between the 2 checkpoints
    box = {}
    t0, t1 = start_box.timestamp, end_box.timestamp
    box['x'] = int((end_box.x - start_box.x) / (t1-t0) * (t1 - timestamp) + start_box.x)
    box['y'] = int((end_box.y - start_box.y) / (t1-t0) * (t1 - timestamp) + start_box.y)
    box['w'] = int((end_box.w - start_box.w) / (t1-t0) * (t1 - timestamp) + start_box.w)
    box['h'] = int((end_box.h - start_box.h) / (t1-t0) * (t1 - timestamp) + start_box.h)
    box['entity_name'] = track.entity.name
    return box


def create_entities(name_to_info):
    """Create the entities from the list of names.
    Returns the dict to map names indices to the Mongo Entity ID
    Args:
    * name_to_info: dict {name:  {'id': index, 'image_url': image_url, 'twitter': <twitter_account>, ...}, ...}
    Returns:
    * index_to_id: dict {name_index: entity.id}
    """
    index_to_id = {}
    for name, attr in name_to_info.items():
        kwargs = {}
        # We may not have the image
        if 'image_url' in attr:
            kwargs['image_url'] = attr['image_url']
        # Social media accounts
        kwargs['accounts'] = {k: attr[k] for k in attr if k not in ['id', 'image_url']}
        ent = Entity(name=name, **kwargs)
        ent.save()
        # Store the indices to link the index from the timecode and the Mongo index
        index = attr['id']
        index_to_id[index] = ent.id
    return index_to_id
