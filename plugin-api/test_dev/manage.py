import os
import time
import glob
from collections import defaultdict
from flask_script import Manager, Server

from init import app
from models import Video, SourceVideo
import box_utils
import read_timecode

TIMECODE_DIR = '/disk2/antoine/data_plugin/'
GET_IMAGES = 'bash get_ref_images.sh'
GET_PROPERTIES = 'bash get_properties.sh'

manager = Manager(app)
# Turn on debugger by default and reloader
manager.add_command("runserver", Server(
    use_debugger=True,
    use_reloader=True,
    host='0.0.0.0')
)

print('----------------------------------------------')
print('Go to <host>:5000/init to populate the MongoDB')
print('----------------------------------------------')


def to_mongodb(timecode_file, url_file, name_file):
    """Exports the timecode data to the Mongo DB"""
    title = timecode_file.split('/')[-2]
    print(title)

    with open(url_file, 'r') as f:
        url = f.read().strip()
    with open(name_file, 'r') as f:
        # First line is header
        names = [e.strip().split(':') for e in f.readlines()][1:]
    print('URL : %s' % url)
    tracks = read_timecode.process_timecode(timecode_file)
    data_dict = {'tracks': tracks, 'url': url}

    # Fetch the reference images URLs
    images_list     = name_file + '.images'
    properties_list = name_file + '.props'
    os.system('%s %s | tail -n +2 > %s' % (GET_IMAGES,     name_file, images_list))
    os.system('%s %s | tail -n +2 > %s' % (GET_PROPERTIES, name_file, properties_list))

    # Read the URLs
    with open(images_list, 'r') as f:
        names_url = [e.strip().split(',') for e in f.readlines()]
    # read the properties
    with open(properties_list, 'r') as f:
        names_props = [e.strip().split(',') for e in f.readlines()]
    # Link names to URL, index and ID
    name_to_info = defaultdict(dict)
    for i, n in enumerate(names):
        name_to_info[n[0]]['id'] = i+1
    for n in names_url:
        name_to_info[n[0]]['image_url'] = n[1]
    # Write props
    for n in names_props:
        name_to_info[n[0]][n[1].lower()] = n[2]

    for e in name_to_info:
        print(e, name_to_info[e])
    index_to_id = box_utils.create_entities(name_to_info)
    box_utils.dict_to_db(data_dict, title, index_to_id)


@app.route('/')
def index():
    return 'Go to <host>:5000/init to populate the MongoDB'


@app.route('/init')
def init():
    """Reset the MongoDB to a predefined initial state.
    - Data is stored at /disk2/antoine/data_plugin
    - For now, 2 trailers: Star Wars 7 and Suicide Squad
    - Video titles are the names of the corresponding folders
    """
    print('Reset the plugin-api DB')
    os.system('mongo plugin-api --eval "db.dropDatabase();"')
    print('Repopulate the DB')
    # Annotations
    timecode_files = glob.glob(TIMECODE_DIR+'*/timecode.txt')
    # URL of the original video
    url_files      = glob.glob(TIMECODE_DIR+'*/URL.txt')
    # Information on the people in the video
    name_files     = glob.glob(TIMECODE_DIR+'*/names.txt')

    print(timecode_files)
    print(url_files)
    print(name_files)
    for t_file, u_file, n_file in zip(timecode_files, url_files, name_files):
        to_mongodb(t_file, u_file, n_file)

    s = 'Reset and repopulate plugin-api DB<br>'
    s += 'Videos in the MongoDB:<br>'
    s += str(Video.objects) + '<br>'
    s += 'SourceVideos in the MongoDB:<br>'
    s += str(SourceVideo.objects) + '<br>'
    return s


@app.route('/<video_name>/<timestamp>/')
def get_people(video_name, timestamp):
    t1 = time.time()
    timestamp = float(timestamp)
    s = "You requested time %.1f s.<br><br>" % timestamp
    # Now get the boxes
    boxes = [box_utils.get_box(t, timestamp) for t in box_utils.tracks_at_t(video_name, timestamp)]

    for b in boxes:
        s += ('Name: %s&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  [%d, %d, %d, %d]<br>'
              % (b['entity_name'], b['x'], b['y'], b['w'], b['h']))
    t2 = time.time()
    s += 'Took %.3f s to query.' % (t2-t1)
    return s


if __name__ == "__main__":
    manager.run()
