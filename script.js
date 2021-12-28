var page = 1;
var index = 0;
var data;
var paused;
var intervalId;

// artist:derekireba
// artist:holivi
$('#column_count').val(Math.ceil($(window).width()/400))

$('#tags').on('change', start);
$('#search-button').on('change', function() {
  if ( !$(this).prop('checked') ) start()
});

var overlayID = 0
$('#column_container').on('click', function(e) {
  window.overlayID = $(e.target).parent().prop('id')
  $('#overlay').append($(e.target).clone()).css('display','block')
});
$('#close').on('click', function(e) {
  $('#overlay').css('display','none')
  $('#overlay .art').remove()
});
$('#follow').on('click', function(e) {
  window.open('https://derpibooru.org/images/'+window.data[window.overlayID].id, '_blank');
});
$('#next').on('click', function(e) {
  window.overlayID++
  $('#overlay .art').remove()
  $('#overlay').append($('#'+overlayID+' .art').clone())
});
$('#auto').on('click', function(e) {
  setInterval(function() {
    window.overlayID++
    $('#overlay .art').remove()
    $('#overlay').append($('#'+overlayID+' .art').clone())
  }, 5000)
});

$('#min-score').on('input', function() {
  $('#min-score-text').html($(this).val());
  if (+$(this).val() > $('#max-score').val()) {
    $('#max-score').val($(this).val());
    $('#max-score-text').html($(this).val());
  }
})
$('#max-score').on('input', function() {
  $('#max-score-text').html($(this).val());
  if (+$(this).val() < $('#min-score').val()) {
    $('#min-score').val($(this).val());
    $('#min-score-text').html($(this).val());
  }
})




function start() {
  $('#search-button').prop('checked', false)
  window.paused = false;
  window.page = 1;
  window.index = 0;
  window.data = [];

  $('#column_container').empty();
  for (var i = 0; i < $('#column_count').val(); i++) {
    $('<div>', {'class':'column'}).appendTo('#column_container');
  }
  if (window.intervalId) clearInterval(window.intervalId);
  window.intervalId = window.setInterval(renderimage, 300/$('#column_count').val());
}

function renderimage() {
  if (window.paused) return;
  if (getShortestColumn().height()-$(window).scrollTop() > 2*$(window).height()) return;

  if (window.data[window.index] == undefined) {
    getdata();
    return;
  }
  createCard(window.data[window.index]).appendTo(getShortestColumn())
  window.index++
}

function createCard(data) {
  let card = $('<div>', {
    'id': window.index,
    'class': 'card',
    'css': { 'padding-bottom': 100/data.aspectRatio+'%' }
  })
  let cardWidth = $('#column_container').width() / $('#column_count').val()
  let cardHeight = cardWidth / data.aspectRatio
  let src = data.tall
  if (cardHeight < 1024) src = data.large
  if (cardHeight <  600) src = data.medium
  if (cardHeight <  250) src = data.small
  if (cardHeight <  150) src = data.tiny

  switch (data.format) {
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      $('<img>', {
        'class': 'art',
        'src': src,
        'loading': 'lazy',
      }).appendTo(card);
      break;
    case 'mp4':
    case 'webm':
      $('<video>', {
        'class': 'art',
        'src': data.medium,
      }).data(data).appendTo(card);
      break;
    default:
      console.log('Unknown format "'+data.format+'" on ' + data.id);
  }
  return card;
}

function getdata() {
  window.paused = true;

  var query = $('#tags').val();
  if (query == '') query = '*';

  $('.filter').each( function() {
    if (!$(this).prop('checked')) query += ' && !' + $(this).prop('id');
  })

  query += ` && score.gte:${$('#min-score').val()}`;
  query += ` && score.lte:${$('#max-score').val()}`;

  var sf = $('input[name="sf"]:checked').val()

  $.getJSON('https://derpibooru.org/api/v1/json/search/images', {
    'per_page': '50',
    'page': window.page,
    'q': query,
    'filter_id': 56027,
    'sf': sf
  }).done(function(APIreply) {
    console.log(query)
    console.log(APIreply)
    if (APIreply.images.length == 0) return;

    for(var image of APIreply.images) {
      window.data.push({
        'id': image.id,
        'format': image.format,
        'aspectRatio': image.aspect_ratio,
        'tall': image.representations.tall,
        'large': image.representations.large,
        'medium': image.representations.medium,
        'small': image.representations.small,
        'tiny': image.representations.thumb_small,
      })
    }
    window.page++
    window.paused = false;
  })

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
