var page = 1;
var index = 0;
var data;
var paused;
var intervalId;

// artist:derekireba
// artist:holivi
var screenAspectRatio = $(window).width()/$(window).height()
if (screenAspectRatio > 1.7) {
  $('#column_count').val(3)
} else if (screenAspectRatio > 1) {
  $('#column_count').val(2)
} else {
  $('#column_count').val(1)
}
$(':root').css('--column-width', $('#column_width').val()/$('#column_count').val()+'vw');

$('#tags').on('change', start);
$('#column_width').on('input', function() {
  $(':root').css('--column-width', this.value/$('.column').length+'vw');
});

$('#column_container').on('click', function(e) {
  console.log($(e.target).parent().attr('id'))
  $('#overlay').append($(e.target).clone()).css('display','block')
});
$('#close').on('click', function(e) {
  $('#overlay').css('display','none')
  $('#overlay .art').remove()
});

function start() {
  window.paused = false;
  window.page = 1;
  window.index = 0;
  window.data = [];

  $('#column_container').empty();
  for (var i = 0; i < $('#column_count').val(); i++) {
    $('<div>', {'class':'column'}).appendTo('#column_container');
  }
  if (window.intervalId) clearInterval(window.intervalId);
  window.intervalId = window.setInterval(renderimage, 100);
}

function getdata() {
  window.paused = true;

  var query = '('+ $('#tags').val() +')';
  if (query == '()') query = '*';

  var exclude = []
  if (!$('#safe').prop('checked')) exclude.push('!safe');
  if (!$('#suggestive').prop('checked')) exclude.push('!suggestive');
  if (!$('#questionable').prop('checked')) exclude.push('!questionable');
  if (!$('#explicit').prop('checked')) exclude.push('!explicit');
  if (!$('#semi-grimdark').prop('checked')) exclude.push('!semi-grimdark');
  if (!$('#grimdark').prop('checked')) exclude.push('!grimdark');
  if (!$('#grotesque').prop('checked')) exclude.push('!grotesque');
  if (exclude.length > 0) query += ' && ' + exclude.join(' && ');

  $.getJSON('https://derpibooru.org/api/v1/json/search/images', {
    'per_page': '50',
    'page': window.page,
    'q': query,
    'filter_id': 56027,
    'sf': 'score'
  }).done(function(APIreply) {
    console.log(query)
    console.log(APIreply)
    if (APIreply.images.length == 0) return;

    for(var image of APIreply.images) {
      window.data.push({
        'id': image.id,
        'format': image.format,
        'aspectRatio': image.aspect_ratio,
        'preview': image.representations.tall,
        'full': image.representations.full,
      })
    }
    window.page++
    window.paused = false;
  })

}

function renderimage() {
  if (window.paused) return;
  if ($('html').height()-$(window).scrollTop() > 2*$(window).height()) return;

  if (window.data[window.index] == undefined) {
    getdata();
    return;
  }
  createCard(window.data[window.index]).appendTo(getShortestColumn())
  window.index++
}

function createCard(data) {
  var card = $('<div>', {
    'id': window.index,
    'class': 'card',
    'css': { 'padding-bottom': 100/data.aspectRatio+'%' }
  })

  switch (data.format) {
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      $('<img>', {
        'class': 'art',
        'src': data.preview,
        'loading': 'lazy',
      }).data(data).appendTo(card);
      break;
    case 'mp4':
    case 'webm':
      $('<video>', {
        'class': 'art',
        'src': data.preview,
      }).data(data).appendTo(card);
      break;
    default:
      console.log('Unknown format "'+data.format+'" on ' + data.id);
  }
  return card;
}

function isArtist(tag) { return tag.includes('artist:'); }
function isNotArtist(tag) { return !tag.includes('artist:'); }
function formatNumber(num) {
  if (num < -1e3) return (num/1e3).toFixed(1)+'k';
  if (num <  1e3) return num;
  if (num <  1e4) return (num/1e3).toFixed(1)+'k';
  if (num <  1e6) return (num/1e3).toFixed(0)+'k';
  if (num <  1e7) return (num/1e6).toFixed(1)+'M';
}
function formatTime(dateString) {
  var relativeTime = new Date( new Date() - new Date(dateString) );
  if (relativeTime.getYear() == 71) return `1 year ago`;
  if (relativeTime.getYear() > 71) return `${relativeTime.getYear()-70} years ago`;
  if (relativeTime.getMonth() == 1) return `1 month ago`;
  if (relativeTime.getMonth() > 1) return `${relativeTime.getMonth()} months ago`;
  if (relativeTime.getDate() == 2) return `1 day ago`;
  if (relativeTime.getDate() > 2) return `${relativeTime.getDate()-1} days ago`;
  if (relativeTime.getHours() == 1) return `1 hour ago`;
  if (relativeTime.getHours() > 1) return `${relativeTime.getHours()} hours ago`;
  if (relativeTime.getMinutes() == 1) return `1 minute ago`;
  if (relativeTime.getMinutes() > 1) return `${relativeTime.getMinutes()} minutes ago`;
  return `just now`;
}
function getShortestColumn() {
  var output
  var currentHeight = Number.MAX_SAFE_INTEGER
  $('.column').each( function() {
    if ($(this).height() < currentHeight) {
      currentHeight = $(this).height();
      output = $(this);
    }
  });
  return output
}
