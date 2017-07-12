
function sync_vid {
  # Upload features, cuts of the reference video.
  # Sync the new source with the reference video.
  VID_ID=$1
  SOURCE_URL=$2
  # Add features to the video
  echo Compute features and cuts
  echo curl -X POST father02.local:3000/videos/$VID_ID/compute
  curl -X POST father02.local:3000/videos/$VID_ID/compute
  echo
  echo 
  echo Sync
  curl -X POST --data "source_url=$NEW_SOURCE_URL" father02.local:3000/sourcevideos/sync/$VID_ID/
  echo "**************************************************************************"
}

# Suicide squad
# VID_ID is the id of the video to sync with
# This is changing on every resets
VID_ID=$1
# Warner Bros Deutch (no offsets)
NEW_SOURCE_URL=youtube.com/watch?v=kV4rLgNlUIQ
sync_vid $VID_ID $SOURCE_URL
# Zero Media version (with offsets)
NEW_SOURCE_URL=youtube.com/watch?v=hZUPQ1dQ3B8
sync_vid $VID_ID $SOURCE_URL
echo Ready to test !
