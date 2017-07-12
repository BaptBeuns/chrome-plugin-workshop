function showTimecode() {
    if (choice_display !== 'normal') {
        return false;
    }
    $('#video div.timecode').remove();

    setRatio();
    if (timecode !== null && overlay) {
        timecode.persons.sort(keysrt('position', 0));
        $.each(timecode.persons, function (idx) {
            if (this.position[0] !== '') {
                var left = offset[0] + (this.position[0] * ratio);
                var top = offset[1] + (this.position[1] * ratio);
                var index = this.id;
                $('<div/>', {'class': 'timecode', 'data-name': names[this.id][0], css: {
                    marginLeft: left + 'px',
                    marginTop: top + 'px'
                }}).append(
                    $('<div/>', {'class': 'face', css: {
                        width: (this.position[2] * ratio),
                        height: (this.position[3] * ratio)
                    }}).click(function () {
                        showPerson(index);
                    }),
                    $('<div/>', {'class': 'name', 'text': names[this.id ][0]})
                ).prependTo($('#video'));
            }
        });

        $.each($('#video div.name'), function () {
            $(this).css('margin-left', -($(this).outerWidth() / 2));
        });
    }
}

function showPerson(index) {
    var name = names[index][0];
    if (loading && !choice_) {
        return false;
    }

    hideArrow('check_it_later');
    hideArrow('people_like');

    loading = true;

    $('#panel').removeClass('hide');
    $('#panel h2').text(name);

    $('#panel .loading').show();
    $('#panel li[data-tab=bio]').click();

    var left = $(window).outerWidth() - $('#panel').outerWidth();
    if ($('#panel').hasClass('phone')) {
        left -= 230;
    } else {
        left -= 300;
    }

    getData('tweeter', index);
    getData('bio', index);
    getData('filmography', index);
    getData('news', index);
    getData('images', index);
    getData('videos', index);
    getData('amazon_actor', index);
    getData('amazon_character', index);
    if(talkshow) {
        getData('amazon_author', index);
        //getData('amazon_artist', index);
    } else {
        getData('amazon_movie', index);
    }
    if(forcecontent && talkshow)
        getData('amazon_movie', index);
    getData('facebook', index);
    getData('instagram', index);
    getData('music', index);
    getData('anecdotes', index);
    getData('store', index);
    $('#panel .loading').hide();

    $('.tab').css({height: ($("#panel").outerHeight() - 250)});
    loading = false;
}
function showNames() {
    var persons = $('div#persons'),
        persons_str = '';

    if (loading && choice_display !== "Android" && choice_display !== "WindowsPhone" && choice_display !== "Iphone") {
        return false;
    }

    persons.empty();

    if (timecode !== null) {

        loading = true;

        $.each(timecode.persons, function () {
            if (persons_str !== '') {
                persons_str += ',';
            }

            persons_str += names[(this.id)][0];
        });

        if (timecode === null) {
            loading = false;
            return false;
        }
        timecode.persons.sort(keysrt('position', 0));
        $.each(timecode.persons, function (p, picture) {
            var missed = (this.position[0] == '') ? $('<div/>', {'class': 'missed', text: 'You just missed'}):$('<div/>', {'class': 'missed', text: ''});
            var suffix = favorites[this.id]?'':'-o';
            var name = names[(this.id )][0];
            var index = this.id;

            var animate_person = (choice_display == 'normal') ? 'animated bounceInUp':'';

            $('<div/>', {'id':(this.id), class: 'person ' + animate_person, 'data-name': names[(this.id)][0]}).append(
                missed,
                $('<div/>', {'class': 'image', 'style': 'background-image: url(' + preload_pictures_url[(this.id)] + ')'}).click(function () {
                    showPerson(index);
                }),
                $('<div/>', {'class': 'name', 'text': names[(this.id)][0]}).click(function () {
                    showPerson(index);
                })
            ).prependTo(persons);
            document.getElementById(this.id).appendChild(divTest);
            addHearAnimationById(this.id);

        });
        persons.css({marginBottom: '5px'});
        persons.css({position:'absolute', top: $('#video').offset().top + $('#video').height, left:$('#video').offset().left, width:$('#video').width()});
        persons.css({background: 'Transparent'});
        persons.show();
        loading = false;
        var position = persons.offset();

        setTimeout(function() {
            showArrow('people_like', position.top - 100, position.left - 180);
        }, 1000);

        setTimeout(function() {
            showArrow('check_it_later', position.top - 30, position.left + persons.outerWidth() + 50);
        }, 2000);
    }
}

