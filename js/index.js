'use strict';

const queryBaseURL = 'http://classes.berkeley.edu/enrollment/update/';

function getClassStatus(termID, classID, callback) {
    const queryURL = queryBaseURL + termID + '/' + classID;
    $.getJSON('https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + queryURL + '"') + '&format=json').done(function(data) {
        callback(data.query.results.json);
    }).fail(function() {
        callback(null);
    });
}

$(document).ready(function() {
    $.getJSON('ajax/terms.json').done(function(terms) {
        $.each(terms, function(termName, termID) {
            $('#termID').append($('<option>', {value : termID}).text(termName));
        });
    }).fail(function() {
        window.alert('Terms are not loaded!');
        window.close();
    });
    $('#classID').bind('keypress', function(event) {
        if (event.keyCode == '13') {
            $('#selectBtn').click();
        }
    });
    $('#selectBtn').click(function() {
        const classID = $('#classID').val();
        if (/^\d+$/.test(classID) && classID.length == 5) {
            $('#selectBtn').prop('disabled', true);
            getClassStatus($('#termID').val(), classID, function(data) {
                if (data == null) {
                    window.alert('Unknown network error!');
                } else if (data.classSections == null) {
                    window.alert('You entered an invalid Class ID!');
                    $('#classID').val('');
                    $('#classID').focus();
                } else {
                    window.alert(JSON.stringify(data));
                }
                $('#selectBtn').prop('disabled', false);
            });
        } else {
            window.alert('Please enter a five-digit integer in Class ID!');
            $('#classID').val('');
            $('#classID').focus();
        }
    });
});
