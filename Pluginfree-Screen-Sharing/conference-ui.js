﻿var config = {
    openSocket: function (config) {
        var channel = config.channel || location.hash.replace('#', '') || 'pluginfree-screen-sharing';
        var socket = new Firebase('https://rtcweb.firebaseIO.com/' + channel);
        socket.channel = channel;
        socket.on('child_added', function (data) {
            config.onmessage && config.onmessage(data.val());
        });
        socket.send = function (data) {
            this.push(data);
        };
        config.onopen && setTimeout(config.onopen, 1);
        socket.onDisconnect().remove();
        return socket;
    },
    onRemoteStream: function (media) {
        var video = media.video;
        video.setAttribute('controls', true);
        participants.insertBefore(video, participants.firstChild);
        video.play();
        rotateVideo(video);
    },
    onRoomFound: function (room) {
        var alreadyExist = document.getElementById(room.broadcaster);
        if (alreadyExist) return;

        if (typeof roomsList === 'undefined') roomsList = document.body;

        var tr = document.createElement('tr');
        tr.setAttribute('id', room.broadcaster);
        tr.innerHTML = '<td>' + room.roomName + '</td>' +
            '<td><button class="join" id="' + room.roomToken + '">Open Screen</button></td>';
        roomsList.insertBefore(tr, roomsList.firstChild);

        tr.onclick = function () {
            var tr = this;
            conferenceUI.joinRoom({
                roomToken: tr.querySelector('.join').id,
                joinUser: tr.id
            });
            hideUnnecessaryStuff();
        };
    },
    onNewParticipant: function (participants) {
        var numberOfParticipants = document.getElementById('number-of-participants');
        if (!numberOfParticipants) return;
        numberOfParticipants.innerHTML = participants + ' room participants';
    }
};

function createButtonClickHandler() {
    captureUserMedia(function () {
        conferenceUI.createRoom({
            roomName: ((document.getElementById('conference-name') || {}).value || 'Anonymous') + ' shared screen with you'
        });
    });
    hideUnnecessaryStuff();
}

function captureUserMedia(callback) {
    var video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('controls', true);
    participants.insertBefore(video, participants.firstChild);

    var screen_constraints = {
        mandatory: {
            chromeMediaSource: 'screen'
        },
        optional: []
    };
    var constraints = {
        audio: false,
        video: screen_constraints
    };
    getUserMedia({
        video: video,
        constraints: constraints,
        onsuccess: function (stream) {
            config.attachStream = stream;
            callback && callback();

            video.setAttribute('muted', true);
            rotateVideo(video);
        },
        onerror: function () {
            if (location.protocol === 'http:') {
                alert('Please test this WebRTC experiment on HTTPS.');
            } else {
                alert('Screen capturing is either denied or not supported.');
            }
        }
    });
}

/* on page load: get public rooms */
var conferenceUI = conference(config);

/* UI specific */
var participants = document.getElementById("participants") || document.body;
var startConferencing = document.getElementById('start-conferencing');
var roomsList = document.getElementById('rooms-list');

if (startConferencing) startConferencing.onclick = createButtonClickHandler;

function hideUnnecessaryStuff() {
    var visibleElements = document.getElementsByClassName('visible'),
        length = visibleElements.length;
    for (var i = 0; i < length; i++) {
        visibleElements[i].style.display = 'none';
    }
}

function rotateVideo(video) {
    video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
    setTimeout(function () {
        video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
    }, 1000);
}

(function () {
    var uniqueToken = document.getElementById('unique-token');
    if (uniqueToken) if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
    else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
})();