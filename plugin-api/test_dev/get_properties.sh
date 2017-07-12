# Fetch the images URLs for people listed in the input file from the mysql DB

if [ $# -lt 1 ]
then
  echo Usage: bash $0 NAMES_FILE
  exit 1
fi

if [ ! -f $1 ]
then
  echo $1 is not a valid file.
  echo Usage: bash $0 NAMES_FILE
  exit 1
fi

# DB configuration
IP=13.93.122.111
DB=rcwd
USER=django

TEMP_FILE=names.txt.temp
NAMES_ONLY=names.txt.clean

# Get names from txt file
# Ignore header line
tail -n +2 $1 > $TEMP_FILE
# Read line by line
while read l;
do
  # Split on the first :
  echo $l | grep -oE "^[a-zA-Z .-]*" >> $NAMES_ONLY
done < $TEMP_FILE
rm $TEMP_FILE

# Get names from txt file
NAMES='"'$(cat $NAMES_ONLY | tr '\n' ',' | sed -r 's/,([a-Z])/", "\1/g')
NAMES='('${NAMES::-1}'")'
rm $NAMES_ONLY
# Connect to the DB then ask for the URLs of the reference images
# TODO: Get the password from the Reminiz Dropbox
mysql -h$IP -D$DB -u$USER -pGpqozK0q9dUE6jG << EOF
SELECT CONCAT(celebrity.name, ',', prop.name, ',', prop_val.value) FROM celebrity
INNER JOIN property_value             AS prop_val             ON celebrity.id = prop_val.celebrity_id
INNER JOIN property                   AS prop                 ON prop_val.property_id = prop.id
INNER JOIN celebrities_referenceimage AS ref_image ON celebrity.id = ref_image.celebrity_id
WHERE celebrity.name in $NAMES
GROUP BY celebrity.name, prop.name;
EOF
# We use GROUP BY to only get the first image

