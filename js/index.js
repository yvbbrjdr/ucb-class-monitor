'use strict';

const queryBaseURL = 'http://classes.berkeley.edu/enrollment/update/';

var classList = [];

function getClassStatus(termID, classID, callback) {
    const queryURL = queryBaseURL + termID + '/' + classID;
    $.getJSON('//query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + queryURL + '"') + '&format=json').done(function(data) {
        if (callback != null) {
            data.query.results.json.changed = Math.floor(Date.now() / 1000);
            callback(data.query.results.json);
        }
    }).fail(function() {
        if (callback != null) {
            callback(null);
        }
    });
}

function Record(termID, classID, status) {
    this.termID = termID;
    this.classID = classID;
    this.status = status;
    this.sameID = function(rhs) {
        return this.termID == rhs.termID && this.classID == rhs.classID;
    };
    this.updateStatus = function(callback) {
        const self = this;
        getClassStatus(this.termID, this.classID, function(data) {
            var changed = false;
            if (self.status.classSections.enrollmentStatus.enrolledCount != data.classSections.enrollmentStatus.enrolledCount || self.status.classSections.enrollmentStatus.waitlistedCount != data.classSections.enrollmentStatus.waitlistedCount) {
                changed = true;
            }
            self.status = data;
            if (callback != null) {
                callback(changed);
            }
        });
    };
    this.makeRow = function(index) {
        var content = '<tr>';
        content += '<td>' + this.termID + '</td>';
        content += '<td>' + this.status.classSections.id + '</td>';
        var status;
        if (parseInt(this.status.classSections.enrollmentStatus.enrolledCount) < parseInt(this.status.classSections.enrollmentStatus.maxEnroll)) {
            status = 'Open';
        } else if (parseInt(this.status.classSections.enrollmentStatus.waitlistedCount) < parseInt(this.status.classSections.enrollmentStatus.maxWaitlist)) {
            status = 'Wait List';
        } else {
            status = 'Closed';
        }
        content += '<td>' + status + '</td>';
        content += '<td>' + this.status.classSections.enrollmentStatus.enrolledCount + ' / ' + this.status.classSections.enrollmentStatus.maxEnroll + '</td>';
        content += '<td>' + this.status.classSections.enrollmentStatus.waitlistedCount + ' / ' + this.status.classSections.enrollmentStatus.maxWaitlist + '</td>';
        content += '<td>' + new Date(parseInt(this.status.changed) * 1000).toLocaleString() + '</td>';
        content += '<td><button type="button" class="btn btn-danger btn-xs" id="' + index + '">Delete</button></td>';
        content += '</tr>';
        return content;
    };
}

function makeTable() {
    $('#tableBody').empty();
    $.each(classList, function(index, record) {
        $('#tableBody').append(record.makeRow(index));
        $('button#' + index).click(function() {
            classList.splice(index, 1);
            makeTable();
        });
    });
    localStorage.setItem('classList', JSON.stringify(classList));
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
        const termID = $('#termID').val();
        const classID = $('#classID').val();
        if (/^\d+$/.test(classID) && classID.length == 5) {
            $('#selectBtn').prop('disabled', true);
            getClassStatus(termID, classID, function(data) {
                if (data == null) {
                    window.alert('Unknown network error!');
                } else if (data.classSections == null) {
                    window.alert('You entered an invalid Class ID!');
                    $('#classID').val('');
                    $('#classID').focus();
                } else {
                    const record = new Record(termID, classID, data);
                    var ok = true;
                    $.each(classList, function(index, value) {
                        if (value.sameID(record)) {
                            ok = false;
                            return false;
                        }
                    });
                    if (ok) {
                        classList.push(record);
                        makeTable();
                        $('#classID').val('');
                        $('#classID').focus();
                    } else {
                        window.alert('You had selected this class!');
                        $('#classID').val('');
                        $('#classID').focus();
                    }
                }
                $('#selectBtn').prop('disabled', false);
            });
        } else {
            window.alert('Please enter a five-digit integer in Class ID!');
            $('#classID').val('');
            $('#classID').focus();
        }
    });
    $('#refreshNowBtn').click(function() {
        $.each(classList, function(index, record) {
            record.updateStatus(function() {
                makeTable();
            });
        });
    });
    const ls = localStorage.getItem('classList');
    if (ls != null) {
        classList = JSON.parse(ls);
        for (var i = 0 ; i < classList.length ; i++) {
            classList[i] = new Record(classList[i].termID, classList[i].classID, classList[i].status);
        }
        makeTable();
    }
});
