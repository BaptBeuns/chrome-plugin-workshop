from __future__ import division


def process_line(line):
    """Process a line of the timecode file to get:
        - t     : timestamp
        - bboxes: { person_id: [x1, y1, x2, y2], ...}
    """
    parts = line.strip().split('_')
    t = parts[0]
    bboxes = {}
    for p in parts[1:]:
        person, bbox = p[1:-1].split(':')
        bbox = tuple([int(e) for e in bbox.split(',') if len(e) > 0])
        if len(bbox) > 0:
            bboxes[int(person)] = bbox
    return t, bboxes


def text_to_meta(lines):
    """Process all the lines of a timecode file
    Returns:
    * resolution: [W, H]
    * stamps    : [t1, ...] list of timestamps per frame
    * bboxes    : [{person_id: [x1, y1, x2, y2], ...}, ...] list of bboxes per frame
    """
    # 1st line -> resolution of the movie
    resolution = [int(e) for e in lines[0][:-1].split(':')]
    # others : temps_[actord_id: bounding_box]_[actor_id: bounding_box]
    stamps = []
    bboxes = []
    processed_lines = [process_line(l) for l in lines[1:]]
    stamps, bboxes = zip(*processed_lines)
    return resolution, stamps, bboxes


def make_tracks(stamps, boxes):
    """Gather boxes and stamps per track.
    Args:
    * stamps    : [t1, ...] list of timestamps per frame
    * bboxes    : [{person_id: [x1, y1, x2, y2], ...}, ...] list of bboxes per frame
    Returns:
    * tracks: [ (person_id, [(t, box), ...]), ... ]
    """
    tracks = []
    # { people: [(t, box), ...], ...} of people on screen at t
    current = {}

    for frame_t, frame_boxes in zip(stamps, boxes):
        # Loop over people on screen
        for person_id in frame_boxes:
            if person_id not in current:
                # New person on screen
                current[person_id] = [(float(frame_t), frame_boxes[person_id])]
            else:
                # person_id entity was in the track, change end
                current[person_id].append((float(frame_t), frame_boxes[person_id]))

        # Check if some disappeared
        to_remove = [person_id for person_id in current
                     if person_id not in frame_boxes]
        # Person disappeared => end of its track
        for person_id in to_remove:
            tracks.append((person_id, current[person_id]))
            current.pop(person_id, None)
    return tracks


def checkpoint_tracks(tracks, N=2):
    """Pick <N> checkpoints per track. If N=2, pick first and last box.
    Args:
    * tracks             : [ (person_id, [(t, box), ...]), ... ]
    Returns:
    * checkpointed_tracks: [ (person_id, [(t, box), ...]), ... ]
    """
    checkpointed_tracks = []
    if N == 2:
        checkpointed_tracks = [(p_id, [t_b[0], t_b[-1]]) for (p_id, t_b) in tracks]
    else:
        raise ValueError
    return checkpointed_tracks


def process_timecode(timecode_file):
    """ - Read timecode file
        - Create tracks
        - Choose boxes to represent the tracks
        - Reformat data (TODO remove this step
        - Boxes are rescaled to [0, 1]
    Args:
    * timecode_file: path to the timecode_file
    Returns:
    * tracks : [{'annotation': person_id, 'faces': [{'time': t, 'box': box},  ...]}, ...]
    """
    with open(timecode_file, 'r') as f:
        data = f.readlines()
    res, stamps, boxes = text_to_meta(data)
    print('Resolution: %s' % res)
    print('%d boxes in the timecode.txt' % len(boxes))
    tracks = make_tracks(stamps, boxes)
    # Keep only N boxes per track
    checkpointed_tracks = checkpoint_tracks(tracks)
    # Reformat for easier insertion into MongoDB
    # TODO: fix this
    data_tracks = []
    for person_id, t_boxes in checkpointed_tracks:
        faces = []
        for t, box in t_boxes:
            # Boxes are now defined in [0, 1]
            b = [box[0] / res[0], box[1] / res[1], box[2] / res[0], box[3] / res[1]]
            faces.append({'time': t, 'box': b})
        data_tracks.append({'annotation': person_id,
                            'faces': faces})
    return data_tracks

if __name__ == "__main__":
    TEXT_FILE = '/disk2/antoine/data_plugin/timecode.txt'
    print(process_timecode(TEXT_FILE))
