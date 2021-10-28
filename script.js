var page = 1;
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

function start() {
  if (window.paused) return;
  window.page = 1;
  window.data = [];
  if (window.intervalId) clearInterval(window.intervalId);
  $('#column_container').empty();
  for (var i = 0; i < $('#column_count').val(); i++) {
    $('<div>', {'class':'column'}).appendTo('#column_container');
  }
  window.intervalId = window.setInterval(renderimage, 100);
}

function getdata() {
  window.paused = true;

  var query = '('+ $('#tags').val() +')';
  if (query == '()') query = '*';

  var exclude = []
  if (!$('#safe').prop( "checked" )) exclude.push('!safe');
  if (!$('#suggestive').prop( "checked" )) exclude.push('!suggestive');
  if (!$('#questionable').prop( "checked" )) exclude.push('!questionable');
  if (!$('#explicit').prop( "checked" )) exclude.push('!explicit');
  if (!$('#semi-grimdark').prop( "checked" )) exclude.push('!semi-grimdark');
  if (!$('#grimdark').prop( "checked" )) exclude.push('!grimdark');
  if (!$('#grotesque').prop( "checked" )) exclude.push('!grotesque');
  if (exclude.length > 0) query += ' && ('+ exclude.join(' && ') +')';

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
    window.data = window.data.concat(APIreply.images);
    window.page++
    window.paused = false;
  });
}

function renderimage() {
  if (window.paused) return;
  if ($('html').height()-$(window).scrollTop() > 2*$(window).height()) return;

  if (window.data.length == 0) {
    getdata();
    return;
  }
  createCard(window.data.shift()).appendTo(getShortestColumn())
}

function createCard(data) {
  var card = $('<div>', {'class':'card'})
  if (data.aspect_ratio < .5) card.addClass('long');
  if (data.aspect_ratio < .1) card.addClass('longer');

  // Building infobox
  var infobox = $('<div>', {'class':'infobox'}).appendTo(card);

  var groupLeft = $('<div>').appendTo(infobox);
  $('<div>', {
    'html': formatNumber(data.score),
    'class':'textinfo score'
  }).appendTo(groupLeft);

  var groupCenter = $('<div>').appendTo(infobox);
  $('<a>', {
    'class': 'textinfo link',
    'href': 'https://derpibooru.org/images/'+data.id,
    'target': '_blank',
    'rel':'noopener noreferrer'
  }).appendTo(groupCenter);

  var groupRight = $('<div>').appendTo(infobox);
  var artists = data.tags.filter(isArtist);
  for (var i = 0; i < artists.length; i++) {
    artists[i] = artists[i].substring(7);
  }
  if (artists.length == 1) {
    $('<div>', {
      'html': artists,
      'class':'textinfo artist dropdown',
      'css': {
        'cursor': 'pointer',
        'padding-left': '20px'
      }
    }).on('click', function(e) {
      document.getElementById('tags').value = 'artist:'+e.target.innerHTML;
      start();
    }).appendTo(groupRight);
  }
  if (artists.length > 1) {
    artist = $('<div>', {'class':'textinfo artist dropdown'}).appendTo(groupRight);
    artistList = $('<div>', {'class':'artist-list'}).appendTo(artist);
    for (var i = 0; i < artists.length && i < 100; i++) {
      listItem = $('<div>', {
        'html': artists[i],
        'class': 'floatinfo'
      }).on('click', function(e) {
        document.getElementById('tags').value = 'artist:'+e.target.innerHTML;
        start();
      }).appendTo(artistList);
    }
  }

  var tag = $('<div>', {'class':'textinfo tag dropdown'}).appendTo(groupRight);
  var tagList = $('<div>', {'class':'tag-list'}).appendTo(tag);
  var tags = data.tags.filter(isNotArtist);
  for (var i = 0; i < tags.length && i < 50; i++) {
    $('<div>', {
      html: tags[i],
      'class': 'floatinfo'
    }).on('click', function(e) {
      $('#tags').val(e.target.innerHTML);
      start();
    }).appendTo(tagList);
  }


  // Building content
  var content = $('<div>', {'class': 'content'}).appendTo(card);
  content.css('padding-bottom', 100/data.aspect_ratio+'%')
  switch (data.format) {
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      $('<img>', {
        'class': 'art',
        'src': data.representations.small,
        'loading': 'lazy',
      }).appendTo(content);
      break;
    case 'mp4':
    case 'webm':
      $('<video>', {
        'class': 'art',
        'src': data.representations.small,
      }).appendTo(content);
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
